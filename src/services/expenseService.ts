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
import { notificationService } from "./notificationService";

const TOP_EXPENSE_CATEGORIES_CACHE_KEY = (companyId: string) =>
  `top_expense_categories:${companyId}`;
const EXPENSES_BY_CATEGORY_DATE_CACHE_KEY = (
  companyId: string,
  categoryId: string,
  startDate: Date,
  endDate: Date
) =>
  `expenses_by_category_date:${companyId}:${categoryId}:${startDate.toISOString()}:${endDate.toISOString()}`;

export const createExpense = async (expense: CreateExpense) => {
  try {
    const validatedData = CreateExpenseSchema.parse(expense);

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

    if (category.limit !== null && validatedData.amount > category.limit) {
      throw new Error(
        `Expense amount exceeds category limit of ${category.limit}`
      );
    }

    const newExpense = await prisma.expense.create({
      data: validatedData,
      include: {
        category: true,
      },
    });

    const cacheKey = TOP_EXPENSE_CATEGORIES_CACHE_KEY(validatedData.companyId);
    await cache.del(cacheKey);

    const pattern = `expenses_by_category_date:${validatedData.companyId}:${validatedData.categoryId}:*`;
    const keys = await cache.keys(pattern);
    await Promise.all(keys.map((key: string) => cache.del(key)));

    // Send notification using centralized method
    await notificationService.sendExpenseNotificationWithUserEmail('CREATE', newExpense);

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
      include: {
        category: true,
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
      include: {
        category: true,
      },
    });

    if (expense?.categoryId) {
      const pattern = `expenses_by_category_date:${companyId}:${expense.categoryId}:*`;
      const keys = await cache.keys(pattern);
      await Promise.all(keys.map((key: string) => cache.del(key)));
    }

    // Send notification using centralized method
    if (expense) {
      await notificationService.sendExpenseNotificationWithUserEmail('DELETE', deletedExpense);
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
      include: {
        category: true,
      },
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

    // Track changes for notification
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    if (validatedData.amount !== undefined && validatedData.amount !== expense.amount) {
      changes.push({
        field: 'amount',
        oldValue: expense.amount,
        newValue: validatedData.amount
      });
    }
    
    if (validatedData.dateProduced && new Date(validatedData.dateProduced).getTime() !== new Date(expense.dateProduced).getTime()) {
      changes.push({
        field: 'dateProduced',
        oldValue: expense.dateProduced,
        newValue: validatedData.dateProduced
      });
    }
    
    if (validatedData.categoryId && validatedData.categoryId !== expense.categoryId) {
      changes.push({
        field: 'categoryId',
        oldValue: expense.categoryId,
        newValue: validatedData.categoryId
      });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id_companyId: { id: expenseId, companyId: expense.companyId } },
      data: validatedData,
      include: {
        category: true,
      },
    });

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

    // Send notification if there are changes using centralized method
    if (changes.length > 0) {
      await notificationService.sendExpenseNotificationWithUserEmail('UPDATE', updatedExpense, changes);
    }

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

export const getExpenses = async (
  companyId: string | undefined,
  userRole: string,
  page = 1,
  pageSize = 10,
  filters?: {
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  try {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Construir el objeto where base
    const baseWhere: any = {
      deletedAt: null,
    };

    // Agregar filtros si se proporcionan
    if (filters?.categoryId) {
      baseWhere.categoryId = filters.categoryId;
    }

    if (filters?.startDate || filters?.endDate) {
      baseWhere.dateProduced = {};
      if (filters?.startDate) {
        baseWhere.dateProduced.gte = filters.startDate;
      }
      if (filters?.endDate) {
        baseWhere.dateProduced.lte = filters.endDate;
      }
    }

    let pagination;
    if (userRole === "SUPERADMIN") {
      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          where: baseWhere,
          include: {
            category: true,
          },
          orderBy: [
            {
              dateProduced: "desc",
            },
          ],
          skip,
          take,
        }),
        prisma.expense.count({
          where: baseWhere,
        }),
      ]);
      pagination = { page, pageSize, total };

      return { expenses, pagination };
    }

    // Para usuarios normales, agregar el filtro de companyId
    const userWhere = {
      ...baseWhere,
      companyId,
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: userWhere,
        include: {
          category: true,
        },
        orderBy: {
          dateProduced: "desc",
        },
        skip,
        take,
      }),
      prisma.expense.count({
        where: userWhere,
      }),
    ]);

    return {
      expenses,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
};

export const getTopExpenseCategories = async (companyId: string) => {
  try {
    const cacheKey = TOP_EXPENSE_CATEGORIES_CACHE_KEY(companyId);

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const categories = await prisma.expenseCategory.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        expenses: {
          where: {
            deletedAt: null,
          },
          select: {
            amount: true,
          },
        },
      },
    });

    const categoriesWithTotals = categories
      .map((category) => ({
        name: category.name,
        totalExpenses: category.expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        ),
      }))
      .sort((a, b) => b.totalExpenses - a.totalExpenses)
      .slice(0, 3);

    await cache.set(cacheKey, JSON.stringify(categoriesWithTotals), 3600);
    return categoriesWithTotals;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
};

export const getExpensesByCategoryAndDateRange = async (
  companyId: string,
  categoryId: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    const cacheKey = EXPENSES_BY_CATEGORY_DATE_CACHE_KEY(
      companyId,
      categoryId,
      startDate,
      endDate
    );

    const cachedData = await cache.get(cacheKey);
    if (cachedData && cachedData !== "[]") {
      return JSON.parse(cachedData);
    }

    const category = await prisma.expenseCategory.findFirst({
      where: {
        id: categoryId,
        companyId,
        deletedAt: null,
      },
    });
    console.log("category", category);

    if (!category) {
      throw new Error("Category not found for this company");
    }

    const expenses = await prisma.expense.findMany({
      where: {
        categoryId,
        companyId,
        deletedAt: null,
        dateProduced: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        dateProduced: "desc",
      },
    });
    console.log("expenses", expenses);

    await cache.set(cacheKey, JSON.stringify(expenses), 3600);

    return expenses;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
};
