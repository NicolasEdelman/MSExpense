import type { Response } from "express";
import { ZodError } from "zod";
import { CreateExpenseSchema } from "../schemas/expenseSchema";
import * as expenseService from "../services/expenseService"
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
