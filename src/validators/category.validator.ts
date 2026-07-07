import { z } from "zod";

// CREATE — name required
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// UPDATE — same shape, but partial + at least one field
export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
