import z from "zod";

export const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  // диалог, который продолжаем; без него создаётся новый. Историю для модели
  // сервер берёт из БД сам — клиент её больше не присылает
  conversationId: z.number().int().positive().optional(),
  // false — разовый вызов без записи в историю (например, «Draft with AI» в почте)
  save: z.boolean().optional(),
});
