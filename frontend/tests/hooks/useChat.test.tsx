import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AxiosError, AxiosHeaders } from "axios";

vi.mock("@/hooks/api/api", () => ({
  api: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

import { api } from "@/hooks/api/api";
import {
  useSendChatMessage,
  getChatErrorMessage,
  conversationKey,
  CONVERSATIONS_QUERY_KEY,
} from "@/hooks/chat/useChat";

describe("getChatErrorMessage", () => {
  it("gives a friendly message for a 429 rate limit", () => {
    expect(getChatErrorMessage({ response: { status: 429 } } as any)).toMatch(/usage limit/);
  });

  it("gives a friendly message for a 503 overload", () => {
    expect(getChatErrorMessage({ response: { status: 503 } } as any)).toMatch(/overloaded/);
  });

  it("falls back to a generic message for anything else", () => {
    expect(getChatErrorMessage(null)).toMatch(/Something went wrong/);
  });
});

describe("useSendChatMessage", () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.post).mockReset();
  });

  it("merges the saved exchange into the conversation cache and bumps it to the top of the sidebar list", async () => {
    queryClient.setQueryData(conversationKey(10), {
      id: 10,
      title: "Chat",
      updated_at: "t0",
      messages: [{ id: 1, role: "user", content: "hi" }],
    });
    queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, [
      { id: 10, title: "Chat", updated_at: "t0" },
      { id: 11, title: "Other", updated_at: "t1" },
    ]);

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        data: {
          conversationId: 10,
          conversation: { id: 10, title: "Chat", updated_at: "t2" },
          messages: [{ id: 2, role: "assistant", content: "hello" }],
          reply: "hello",
        },
      },
    } as any);

    const { result } = renderHook(() => useSendChatMessage(), { wrapper });
    result.current.mutate({ message: "hi", conversationId: 10 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const detail = queryClient.getQueryData<any>(conversationKey(10));
    expect(detail.messages).toHaveLength(2);
    expect(detail.updated_at).toBe("t2");

    const list = queryClient.getQueryData<any[]>(CONVERSATIONS_QUERY_KEY)!;
    expect(list[0].id).toBe(10);
    expect(list).toHaveLength(2);
  });

  it("on a failed send, still shows the saved question plus a friendly error in the cache", async () => {
    const axiosError = new AxiosError(
      "Request failed",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() } as any,
        data: {
          message: "model unavailable",
          data: {
            conversationId: 20,
            conversation: { id: 20, title: "New chat", updated_at: "t1" },
            messages: [{ id: 5, role: "user", content: "hi" }],
          },
        },
      },
    );
    vi.mocked(api.post).mockRejectedValueOnce(axiosError);

    const { result } = renderHook(() => useSendChatMessage(), { wrapper });
    result.current.mutate({ message: "hi" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const detail = queryClient.getQueryData<any>(conversationKey(20));
    expect(detail.messages).toEqual([{ id: 5, role: "user", content: "hi" }]);
    expect(detail.error).toMatch(/overloaded/);
  });
});
