import {
  CreateExpenseCategorySchema,
  UpdateExpenseCategorySchema,
} from "../schemas/categorySchema";
import type {
  CreateExpenseCategory,
  UpdateExpenseCategory,
} from "../schemas/categorySchema";
import { prisma } from "../lib/prisma";
import { ValidationError } from "../lib/errors/validation-error";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

const companiesIds = [
  "a0650f50-bcaa-41f6-95db-e68301d4ccd5",
  "85e60189-7543-4350-b594-a0b799edc2c4",
  "123e4567-e89b-12d3-a456-426614174000",
  "97bc4deb-d93d-4e86-9d35-8018bba6056a",
];

export const validateCompanyId = async (
  companyId: string
): Promise<boolean> => {
  return companiesIds.includes(companyId);
};

export const createCategory = async (
  companyId: string,
  category: CreateExpenseCategory
) => {
  try {
    const companyExists = await validateCompanyId(companyId);
    if (!companyExists) {
      throw new Error(`Company with ID '${companyId}' not found`);
    }

    const validatedData = CreateExpenseCategorySchema.parse(category);
    const result = await prisma.expenseCategory.create({
      data: {
        companyId,
        ...validatedData,
      },
    });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error(
          `Category with name '${category.name}' already exists for this company`
        );
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (error instanceof ZodError) {
      throw new ValidationError(error, "Invalid category data");
    }

    throw error;
  }
};

export const updateCategory = async (
  companyId: string,
  categoryId: string,
  category: UpdateExpenseCategory
) => {
  try {
    const validatedData = UpdateExpenseCategorySchema.parse(category);

    if (Object.keys(validatedData).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const result = await prisma.expenseCategory.update({
      where: {
        id_companyId: {
          id: categoryId,
          companyId,
        },
      },
      data: validatedData,
    });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error(
          `Category with ID '${categoryId}' not found for company with ID '${companyId}'`
        );
      }
      if (error.code === "P2002") {
        throw new Error(
          `Category with name '${category.name}' already exists for this company`
        );
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (error instanceof ZodError) {
      throw new ValidationError(error, "Invalid category data");
    }

    throw error;
  }
};

export const softDeleteCategory = async (
  companyId: string,
  categoryId: string
) => {
  try {
    const result = await prisma.expenseCategory.update({
      where: {
        id_companyId: {
          id: categoryId,
          companyId,
        },
      },
      data: {
        deletedAt: new Date(),
      } as Prisma.ExpenseCategoryUpdateInput,
    });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error(
          `Category with ID '${categoryId}' not found for company with ID '${companyId}'`
        );
      }
      throw new Error(`Database error: ${error.message}`);
    }

    throw error;
  }
};

export const getCategoriesByCompany = async (companyId?: string) => {
  try {
    const result = await prisma.expenseCategory.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: {
        name: "asc",
      },
    });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
};
