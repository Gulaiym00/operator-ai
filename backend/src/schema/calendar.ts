import z from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  location: z.string().max(300).optional(),
  start: z.string().min(1),
  end: z.string().min(1),
  allDay: z.boolean().optional(),
});
