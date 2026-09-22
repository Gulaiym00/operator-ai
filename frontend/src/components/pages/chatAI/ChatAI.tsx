"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Copy, Plus, Send, Sparkles, User } from "lucide-react";
import scss from "./chatAI.module.scss";
import {
  getChatErrorMessage,
  useConversation,
  useSendChatMessage,
} from "@/hooks/chat/useChat";

interface Message {
  key: string | number;
  role: "user" | "assistant";
  content: string;
  time: string;
  // вопрос сохранён, но ответа на него нет (модель была недоступна)
  unanswered?: boolean;
}

const greeting: Message = {
  key: "greeting",
  role: "assistant",
  content:
    "Hi! I'm Operator AI. I can help you manage emails, meetings, tasks, notes and files.",
  time: "",
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

interface ChatViewProps {
  conversationId: number | null;
}

// Один диалог. Сообщения из истории берутся из кэша react-query (он же
// обновляется ответом сервера), а pending — только то, что ещё не сохранено:
// отправленный вопрос, пока идёт ответ, и сообщения об ошибках.
const ChatView = ({ conversationId }: ChatViewProps) => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Message[]>([]);

  const { data: conversation, isLoading, isError } = useConversation(conversationId);
  const { mutate: send, isPending: isTyping } = useSendChatMessage();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // диалог удалён или принадлежит другому пользователю — возвращаемся в новый чат
  useEffect(() => {
    if (isError) router.replace("/");
  }, [isError, router]);

  const savedMessages = conversation?.messages ?? [];
  const saved: Message[] = savedMessages.map((message, index) => ({
    key: message.id,
    role: message.role,
    content: message.content,
    time: formatTime(new Date(message.created_at)),
    // последний вопрос с показанной ошибкой помечать не нужно — она и так видна
    unanswered:
      message.role === "user" &&
      savedMessages[index + 1]?.role !== "assistant" &&
      !(index === savedMessages.length - 1 && conversation?.error),
  }));

  const errorMessages: Message[] = conversation?.error
    ? [{ key: "conversation-error", role: "assistant", content: conversation.error, time: "" }]
    : [];

  const messages = [greeting, ...saved, ...errorMessages, ...pending];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const sendMessage = () => {
    const value = input.trim();

    if (!value || isTyping) return;

    setPending((prev) => [
      ...prev,
      { key: `u-${Date.now()}`, role: "user", content: value, time: formatTime(new Date()) },
    ]);
    setInput("");

    send(
      { message: value, conversationId: conversationId ?? undefined },
      {
        onSuccess: (data) => {
          if (conversationId === null) {
            // новый диалог получил id — переходим на него; вид пересоздастся
            // и возьмёт сообщения из кэша, который хук уже заполнил
            router.replace(`/?c=${data.conversationId}`);
          } else {
            setPending([]);
          }
        },
        onError: (error) => {
          const savedExchange = error.response?.data?.data;

          // вопрос уже сохранён на сервере (хук положил его и текст ошибки в кэш)
          if (savedExchange) {
            if (conversationId === null) {
              router.replace(`/?c=${savedExchange.conversationId}`);
            } else {
              setPending([]);
            }
            return;
          }

          // сервер не ответил вовсе (сеть, 401) — показываем ошибку локально
          setPending((prev) => [
            ...prev,
            {
              key: `e-${Date.now()}`,
              role: "assistant",
              content: getChatErrorMessage(error),
              time: formatTime(new Date()),
            },
          ]);
        },
      },
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    setPending([]);
    setInput("");
    if (conversationId !== null) router.push("/");
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  return (
    <section id={scss.chatAI}>
      <div className="container">
        <div className={scss.chat}>
          {/* HEADER */}

          <header className={scss.header}>
            <div className={scss.headerLeft}>
              <div className={scss.aiIcon}>
                <Sparkles size={18} />
              </div>

              <div>
                <h1>Operator AI</h1>

                <div className={scss.status}>
                  <span />
                  AI assistant
                </div>
              </div>
            </div>

            <button
              type="button"
              className={scss.newChat}
              onClick={handleNewChat}
              disabled={isTyping}
            >
              <Plus size={16} />
              New chat
            </button>
          </header>

          {/* CHAT BODY */}

          <div className={scss.body}>
            <div className={scss.messages}>
              {messages.map((message) => (
                <div
                  key={message.key}
                  className={`${scss.messageRow} ${
                    message.role === "user" ? scss.userRow : scss.aiRow
                  }`}
                >
                  {/* AVATAR */}

                  <div
                    className={`${scss.avatar} ${
                      message.role === "user" ? scss.userAvatar : scss.aiAvatar
                    }`}
                  >
                    {message.role === "user" ? (
                      <User size={15} />
                    ) : (
                      <Bot size={15} />
                    )}
                  </div>

                  {/* MESSAGE */}

                  <div className={scss.messageContent}>
                    <div className={scss.messageTop}>
                      <strong>
                        {message.role === "user" ? "You" : "Operator AI"}
                      </strong>

                      {message.time && <span>{message.time}</span>}
                    </div>

                    <div className={scss.bubble}>{message.content}</div>

                    {message.unanswered && (
                      <p className={scss.noReply}>
                        No reply — the AI was unavailable. Send it again to retry.
                      </p>
                    )}

                    {message.role === "assistant" && (
                      <button
                        type="button"
                        className={scss.copyButton}
                        onClick={() => handleCopy(message.content)}
                      >
                        <Copy size={13} />
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && <div className={scss.loadingState}>Loading conversation...</div>}

              {/* TYPING */}

              {isTyping && (
                <div className={`${scss.messageRow} ${scss.aiRow}`}>
                  <div className={`${scss.avatar} ${scss.aiAvatar}`}>
                    <Bot size={15} />
                  </div>

                  <div className={scss.messageContent}>
                    <div className={scss.messageTop}>
                      <strong>Operator AI</strong>
                    </div>

                    <div className={`${scss.bubble} ${scss.typing}`}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* INPUT */}

          <form className={scss.inputArea} onSubmit={handleSubmit}>
            <div className={scss.inputWrapper}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Operator AI anything..."
                rows={1}
                disabled={isTyping}
              />

              <button
                type="submit"
                className={`${scss.send} ${
                  input.trim() ? scss.sendActive : ""
                }`}
                disabled={!input.trim() || isTyping}
                title="Send message"
              >
                <Send size={16} />
              </button>
            </div>

            <p className={scss.hint}>
              Enter to send · Shift + Enter for a new line
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

const ChatAI = () => {
  const searchParams = useSearchParams();
  const raw = searchParams.get("c");
  const conversationId = raw && /^\d+$/.test(raw) ? Number(raw) : null;

  // key: при смене диалога вид пересоздаётся — черновик и локальные сообщения
  // одного диалога не «протекают» в другой
  return <ChatView key={conversationId ?? "new"} conversationId={conversationId} />;
};

export default ChatAI;
