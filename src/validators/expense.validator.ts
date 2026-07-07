import { z } from "zod";

// rules for CREATING an expense — all fields required
export const createExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.number().positive("Amount must be greater than 0"),
  categoryId: z.number().int().positive(),
  date: z.string().datetime().optional(), // ISO string, optional
});

// rules for UPDATING — all fields OPTIONAL (partial update),
// but at least one must be present
export const updateExpenseSchema = createExpenseSchema
  .partial() // makes every field optional
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
