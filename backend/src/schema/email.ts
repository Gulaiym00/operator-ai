import z from "zod";

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(300),
  body: z.string().min(1),
  threadId: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
});

export const toggleStarSchema = z.object({
  starred: z.boolean(),
});
