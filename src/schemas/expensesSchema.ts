import { z } from "zod";

export const CreateExpenseCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  limit: z.number().min(0).optional(),
});
export type CreateExpenseCategory = z.infer<typeof CreateExpenseCategorySchema>;