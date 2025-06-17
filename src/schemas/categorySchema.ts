import { z } from "zod";

export const CreateExpenseCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  limit: z.number().min(0).optional(),
});
export type CreateExpenseCategory = z.infer<typeof CreateExpenseCategorySchema>;

export const UpdateExpenseCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  limit: z.number().min(0).optional(),
});
export type UpdateExpenseCategory = z.infer<typeof UpdateExpenseCategorySchema>;