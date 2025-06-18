import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  UpdateExpense,
} from "../schemas/expenseSchema";
import { prisma } from "../lib/prisma";
import cache from "../lib/cache";
import { ZodError } from "zod";
import { ValidationError } from "../lib/errors/validation-error";
import { CreateExpense } from "../schemas/expenseSchema";
import { Prisma } from "@prisma/client";

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

export const softDeleteExpense = async (
  expenseId: string,
  companyId: string
) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        companyId: companyId,
      },
    });
    if (expense?.deletedAt) {
      throw new Error("Expense already deleted");
    }

    const deletedExpense = await prisma.expense.update({
      where: { id_companyId: { id: expenseId, companyId } },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      } as Prisma.ExpenseUpdateInput,
    });

    if (expense?.categoryId) {
      const pattern = `expenses_by_category_date:${companyId}:${expense.categoryId}:*`;
      const keys = await cache.keys(pattern);
      await Promise.all(keys.map((key: string) => cache.del(key)));
    }

    return deletedExpense;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("Expense not found");
      }
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
};

export const updateExpense = async (expenseId: string, data: UpdateExpense) => {
  try {
    const validatedData = UpdateExpenseSchema.parse(data);

    if (Object.keys(validatedData).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const expense = await prisma.expense.findFirst({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    let category = null;
    if (validatedData.categoryId) {
      category = await prisma.expenseCategory.findFirst({
        where: {
          id: validatedData.categoryId,
        },
      });

      if (!category) {
        throw new Error("Category not found");
      }
    }

    const updatedExpense = await prisma.expense.update({
      where: { id_companyId: { id: expenseId, companyId: expense.companyId } },
      data: validatedData,
    });

    // Invalidate cache for both old and new category if category was changed
    const patterns = [
      `expenses_by_category_date:${expense.companyId}:${expense.categoryId}:*`,
    ];

    if (
      validatedData.categoryId &&
      validatedData.categoryId !== expense.categoryId
    ) {
      patterns.push(
        `expenses_by_category_date:${expense.companyId}:${validatedData.categoryId}:*`
      );
    }

    const keys = await Promise.all(
      patterns.map((pattern) => cache.keys(pattern))
    );
    await Promise.all(keys.flat().map((key: string) => cache.del(key)));

    return updatedExpense;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("Expense not found");
      }
      if (error.code === "P2003") {
        throw new Error("Invalid category for this company");
      }
      throw new Error(`Database error: ${error.message}`);
    }
    if (error instanceof ZodError) {
      throw new ValidationError(error, "Invalid expense data");
    }
    throw error;
  }
};
