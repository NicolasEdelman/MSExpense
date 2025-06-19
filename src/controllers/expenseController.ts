import type { Response } from "express";
import { ZodError } from "zod";
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
} from "../schemas/expenseSchema";
import * as expenseService from "../services/expenseService";
import { ValidationError } from "../lib/errors/validation-error";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const createExpense = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const { amount, dateProduced, categoryId } = req.body;

    if (!amount || !dateProduced || !categoryId) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const expenseData = await CreateExpenseSchema.parseAsync({
      amount,
      dateProduced,
      categoryId,
      userId,
      companyId: req.user?.companyId,
    });

    const expense = await expenseService.createExpense(expenseData);

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        error,
        "Invalid expense data"
      );
      res.status(400).json({
        success: false,
        error: {
          title: validationError.title,
          detail: validationError.detail,
        },
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const softDeleteExpense = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { expenseId } = req.params;
    const companyId = req.user?.companyId;

    if (!expenseId) {
      res.status(400).json({ error: "Expense ID is required" });
      return;
    }

    if (!companyId) {
      res.status(400).json({ error: "Company ID is required" });
      return;
    }

    const expense = await expenseService.softDeleteExpense(
      expenseId,
      companyId
    );

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const updateExpense = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { expenseId } = req.params;
    const companyId = (req.query.companyId as string) || req.user?.companyId;

    if (!expenseId) {
      res.status(400).json({ error: "Expense ID is required" });
      return;
    }

    if (!companyId) {
      res.status(400).json({ error: "Company ID is required" });
      return;
    }

    const expenseData = await UpdateExpenseSchema.parseAsync(req.body);
    const expense = await expenseService.updateExpense(expenseId, expenseData);

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        error,
        "Invalid expense data"
      );
      res.status(400).json({
        success: false,
        error: {
          title: validationError.title,
          detail: validationError.detail,
          errors: validationError.errors,
        },
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const getExpenses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = (req.query.companyId as string) || req.user?.companyId;
    const userRole = req.user?.role;
    const page = Number.parseInt(req.query.page as string) || 1;
    const pageSize = Number.parseInt(req.query.pageSize as string) || 10;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is required" });
      return;
    }

    if (!userRole) {
      res.status(400).json({ error: "User role is required" });
      return;
    }

    const result = await expenseService.getExpenses(
      companyId,
      userRole,
      page,
      pageSize
    );

    res.status(200).json({
      success: true,
      data: result.expenses,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const getTopExpenseCategories = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    console.log("getTopExpenseCategories");
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ error: "Company ID is required" });
      return;
    }
    const categories = await expenseService.getTopExpenseCategories(companyId);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
};
