import z from "zod";

export const toggleStarSchema = z.object({
  starred: z.boolean(),
});
