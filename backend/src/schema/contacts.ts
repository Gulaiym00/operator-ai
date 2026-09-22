import z from "zod";

const emailField = z.union([z.string().email(), z.literal("")]).nullable().optional();

export const createContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: emailField,
  phone: z.string().max(50).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: emailField,
  phone: z.string().max(50).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});
