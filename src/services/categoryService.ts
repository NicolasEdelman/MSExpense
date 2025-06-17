import { CreateExpenseCategorySchema } from "../schemas/expensesSchema";
import type { CreateExpenseCategory } from "../schemas/expensesSchema";
import { prisma } from "../lib/prisma";
import { ValidationError } from "../lib/errors/validation-error";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

const companiesIds = [
  "a0650f50-bcaa-41f6-95db-e68301d4ccd5",
  "85e60189-7543-4350-b594-a0b799edc2c4",
  "123e4567-e89b-12d3-a456-426614174000",
];

// Función para validar si existe el companyId
export const validateCompanyId = async (companyId: string): Promise<boolean> => {
  return companiesIds.includes(companyId);
};

export const createCategory = async (
  companyId: string,
  category: CreateExpenseCategory
) => {
  try {
    // Validar que el companyId existe
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
