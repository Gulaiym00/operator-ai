import z from "zod";

const statusEnum = z.enum(["todo", "progress", "review", "done"]);
const priorityEnum = z.enum(["low", "medium", "high"]);
const typeEnum = z.enum(["task", "bug"]);

export const createIssueSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  type: typeEnum.optional(),
  sprint: z.string().max(100).optional(),
  dueDate: z.string().nullable().optional(),
});

export const updateIssueSchema = createIssueSchema;
