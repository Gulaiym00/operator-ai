import z from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.coerce.number().int().min(0).max(150).optional(),
  phone: z.string().max(30).optional(),
});
