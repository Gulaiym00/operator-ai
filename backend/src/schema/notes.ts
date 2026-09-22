import z from "zod";

export const createNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(20000).optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(20000).optional(),
});
