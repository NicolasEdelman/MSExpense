import { CreateExpenseSchema } from "../schemas/expenseSchema";
import { prisma } from "../lib/prisma";
import cache from "../lib/cache";
import { ZodError } from "zod";
import { ValidationError } from "../lib/errors/validation-error";
import { CreateExpense } from "../schemas/expenseSchema";

const TOP_EXPENSE_CATEGORIES_CACHE_KEY = (companyId: string) =>
  `top_expense_categories:${companyId}`;
// const EXPENSES_BY_CATEGORY_DATE_CACHE_KEY = (
//   companyId: string,
//   categoryId: string,
//   startDate: Date,
//   endDate: Date
// ) =>
//   `expenses_by_category_date:${companyId}:${categoryId}:${startDate.toISOString()}:${endDate.toISOString()}`;


export const createExpense = async (expense: CreateExpense) => {
  try {
    const validatedData = CreateExpenseSchema.parse(expense);

    // check if category exists
    const category = await prisma.expenseCategory.findUnique({
      where: {
        id_companyId: {
          id: validatedData.categoryId,
          companyId: validatedData.companyId,
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has a limit and if expense amount exceeds it
    if (category.limit !== null && validatedData.amount > category.limit) {
      throw new Error(
        `Expense amount exceeds category limit of ${category.limit}`
      );
    }

    const newExpense = await prisma.expense.create({
      data: validatedData,
    });

    // Delete the cache for this company's top expense categories
    const cacheKey = TOP_EXPENSE_CATEGORIES_CACHE_KEY(validatedData.companyId);
    await cache.del(cacheKey);

    // Invalidate expenses by category and date range cache
    const pattern = `expenses_by_category_date:${validatedData.companyId}:${validatedData.categoryId}:*`;
    const keys = await cache.keys(pattern);
    await Promise.all(keys.map((key: string) => cache.del(key)));

    return newExpense;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error, "Invalid expense data");
    }
    throw error;
  }
};
