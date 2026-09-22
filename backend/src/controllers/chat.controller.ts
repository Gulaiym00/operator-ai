import { NextFunction, Request, Response } from "express";
import { sendChatMessage } from "../services/chat.service";
import {
  deleteConversationService,
  finishExchangeService,
  getContextMessagesService,
  getConversationService,
  listConversationsService,
  startExchangeService,
} from "../services/chatHistory.service";

// req.user кладёт authMiddleware после проверки JWT — берём id оттуда
const getUserId = (req: Request) =>
  (req.user as { id?: number } | undefined)?.id as number;

export const sendChatController = async (
  req: Request<{}, {}, { message: string; conversationId?: number; save?: boolean }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const { message, conversationId, save } = req.body;

    // контекст берём ДО записи нового вопроса; чужой/несуществующий диалог
    // отсекаем здесь же, до вызова модели — не тратим квоту зря
    const history = conversationId
      ? await getContextMessagesService(userId, conversationId)
      : [];

    if (save === false) {
      const reply = await sendChatMessage(userId, history, message);
      res.status(200).json({ message: "Chat reply", data: { reply, conversationId: null } });
      return;
    }

    // вопрос сохраняем до обращения к модели: если она упадёт (лимит, 503),
    // диалог и вопрос всё равно останутся в истории
    const started = await startExchangeService(userId, conversationId, message);

    let reply: string;
    try {
      reply = await sendChatMessage(userId, history, message);
    } catch (error: any) {
      // отвечаем статусом ошибки модели, но прикладываем сохранённый вопрос —
      // клиенту нужен id диалога, чтобы показать его в истории
      res.status(typeof error?.status === "number" ? error.status : 500).json({
        message: error?.message || "AI request failed",
        data: {
          conversationId: started.conversation.id,
          conversation: started.conversation,
          messages: [started.userMessage],
        },
      });
      return;
    }

    const finished = await finishExchangeService(started.conversation.id, reply);

    res.status(200).json({
      message: "Chat reply",
      data: {
        reply,
        conversationId: finished.conversation.id,
        conversation: finished.conversation,
        messages: [started.userMessage, finished.assistantMessage],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listConversationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await listConversationsService(getUserId(req));

    res.status(200).json({ message: "Conversations", data: result });
  } catch (error) {
    next(error);
  }
};

export const getConversationController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getConversationService(getUserId(req), Number(req.params.id));

    res.status(200).json({ message: "Conversation", data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteConversationController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteConversationService(getUserId(req), Number(req.params.id));

    res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    next(error);
  }
};
