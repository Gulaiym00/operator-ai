import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "../api/api";

export interface IChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface IConversation {
  id: number;
  title: string;
  updated_at: string;
}

export interface IConversationDetail extends IConversation {
  messages: IChatMessage[];
  // текст ошибки последней неудачной отправки (только в кэше, на сервере не хранится)
  error?: string;
}

interface ISavedExchange {
  conversationId: number;
  conversation: IConversation;
  messages: IChatMessage[];
}

interface ISendChatResponse {
  message: string;
  data: ISavedExchange & { reply: string };
}

// при сбое модели сервер всё равно возвращает сохранённый вопрос
export interface IChatErrorBody {
  message: string;
  data?: ISavedExchange;
}

export const CONVERSATIONS_QUERY_KEY = ["chat-conversations"];
export const conversationKey = (id: number) => ["chat-conversation", id];

export const useConversations = (enabled = true) =>
  useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<{ data: IConversation[] }>("/chat/conversations");
      return response.data.data;
    },
    enabled,
  });

export const useConversation = (id: number | null) =>
  useQuery({
    queryKey: conversationKey(id ?? 0),
    queryFn: async () => {
      const response = await api.get<{ data: IConversationDetail }>(
        `/chat/conversations/${id}`,
      );
      return response.data.data;
    },
    enabled: id !== null,
    // диалог, которого нет (удалён/чужой) — сразу ошибка, без повторов
    retry: false,
  });

// Диалог с сохранением в историю. Кэш обновляем прямо из ответа сервера —
// без повторных GET после каждого сообщения.
export const useSendChatMessage = () => {
  const queryClient = useQueryClient();

  const applySaved = (
    saved: ISavedExchange,
    isExisting: boolean,
    errorText?: string,
  ) => {
    const key = conversationKey(saved.conversationId);
    const cached = queryClient.getQueryData<IConversationDetail>(key);

    if (cached || !isExisting) {
      const detail: IConversationDetail = {
        ...saved.conversation,
        messages: [...(cached?.messages ?? []), ...saved.messages],
      };
      if (errorText) detail.error = errorText;
      queryClient.setQueryData<IConversationDetail>(key, detail);
    } else {
      queryClient.invalidateQueries({ queryKey: key });
    }

    queryClient.setQueryData<IConversation[]>(CONVERSATIONS_QUERY_KEY, (old) =>
      old
        ? [saved.conversation, ...old.filter((c) => c.id !== saved.conversation.id)]
        : old,
    );
  };

  return useMutation<
    ISendChatResponse["data"],
    AxiosError<IChatErrorBody>,
    { message: string; conversationId?: number }
  >({
    mutationKey: ["send-chat-message"],
    mutationFn: async (body) => {
      const response = await api.post<ISendChatResponse>("/chat", body);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      applySaved(data, !!variables.conversationId);
    },
    // модель недоступна, но вопрос уже сохранён на сервере — показываем его в
    // истории вместе с сообщением об ошибке
    onError: (error, variables) => {
      const saved = error.response?.data?.data;
      if (saved) applySaved(saved, !!variables.conversationId, getChatErrorMessage(error));
    },
  });
};

// Разовый вызов модели без записи в историю (например, «Draft with AI» в почте)
export const useAskAi = () =>
  useMutation<string, AxiosError<{ message: string }>, { message: string }>({
    mutationKey: ["ask-ai"],
    mutationFn: async ({ message }) => {
      const response = await api.post<ISendChatResponse>("/chat", {
        message,
        save: false,
      });
      return response.data.data.reply;
    },
  });

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<{ message: string }>, number>({
    mutationFn: async (id) => {
      await api.delete(`/chat/conversations/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: conversationKey(id) });
      queryClient.setQueryData<IConversation[]>(CONVERSATIONS_QUERY_KEY, (old) =>
        old?.filter((c) => c.id !== id),
      );
    },
  });
};

// Gemini передаёт статус реальной ошибки (429/503/...) через errorHandler,
// а в message кладёт весь сырой JSON от SDK — вытаскивать оттуда текст не нужно,
// разбираем по статусу и показываем понятное сообщение
export const getChatErrorMessage = (error: AxiosError<{ message: string }> | null) => {
  const status = error?.response?.status;

  if (status === 429) {
    return "Operator AI has hit its usage limit for now (the AI provider's rate limit). Please wait a minute and try again.";
  }

  if (status === 503) {
    return "The AI service is temporarily overloaded. Please try again in a moment.";
  }

  return "Something went wrong. Please try again in a moment.";
};
