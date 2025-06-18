import { z } from "zod";

export const CreateExpenseSchema = z.object({
    amount: z.number().min(0),
    dateProduced: z.string().datetime(),
    categoryId: z.string().min(1),
    userId: z.string().min(1),
    companyId: z.string().min(1),
  });
  export type CreateExpense = z.infer<typeof CreateExpenseSchema>;