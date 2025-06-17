import type { Response } from "express";
import { ZodError } from "zod";
import {
  CreateExpenseCategorySchema,
  UpdateExpenseCategorySchema,
} from "../schemas/categorySchema";
import * as expenseService from "../services/categoryService";
import { ValidationError } from "../lib/errors/validation-error";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ error: "Company ID is required" });
      return;
    }

    const categoryData = await CreateExpenseCategorySchema.parseAsync(req.body);

    const category = await expenseService.createCategory(
      companyId,
      categoryData
    );

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        error,
        "Invalid category data"
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

export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ error: "Company ID is required" });
      return;
    }

    const { categoryId } = req.params;
    if (!categoryId) {
      res.status(400).json({ error: "Category ID is required" });
      return;
    }

    const categoryData = await UpdateExpenseCategorySchema.parseAsync(req.body);

    const category = await expenseService.updateCategory(
      companyId,
      categoryId,
      categoryData
    );

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        error,
        "Invalid category data"
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

export const softDeleteCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ error: "Company ID is required" });
      return;
    }

    const { categoryId } = req.params;
    if (!categoryId) {
      res.status(400).json({ error: "Category ID is required" });
      return;
    }

    const category = await expenseService.softDeleteCategory(
      companyId,
      categoryId,
    );

    res.status(200).json({
      success: true,
      data: category,
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
