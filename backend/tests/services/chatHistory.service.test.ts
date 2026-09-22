import { describe, expect, it, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
const connectMock = vi.fn();

vi.mock("../../src/plugins/pg", () => ({
  pool: {
    query: (...args: any[]) => queryMock(...args),
    connect: (...args: any[]) => connectMock(...args),
  },
}));

import {
  toModelContext,
  listConversationsService,
  getConversationService,
  deleteConversationService,
  startExchangeService,
} from "../../src/services/chatHistory.service";

beforeEach(() => {
  queryMock.mockReset();
  connectMock.mockReset();
});

describe("toModelContext", () => {
  it("keeps a clean alternating user/assistant conversation as-is", () => {
    const rows = [
      { role: "user" as const, content: "hi" },
      { role: "assistant" as const, content: "hello" },
      { role: "user" as const, content: "how are you" },
      { role: "assistant" as const, content: "good" },
    ];
    expect(toModelContext(rows)).toEqual(rows);
  });

  it("drops a trailing user question that was never answered", () => {
    const rows = [
      { role: "user" as const, content: "hi" },
      { role: "assistant" as const, content: "hello" },
      { role: "user" as const, content: "unanswered" },
    ];
    expect(toModelContext(rows)).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);
  });

  it("trims a leading assistant message from a windowed slice", () => {
    const rows = [
      { role: "assistant" as const, content: "leftover reply" },
      { role: "user" as const, content: "next question" },
      { role: "assistant" as const, content: "next answer" },
    ];
    expect(toModelContext(rows)).toEqual([
      { role: "user", content: "next question" },
      { role: "assistant", content: "next answer" },
    ]);
  });

  it("returns an empty array for an empty conversation", () => {
    expect(toModelContext([])).toEqual([]);
  });
});

describe("listConversationsService", () => {
  it("queries conversations scoped to the given user", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1, title: "New chat" }] });

    const result = await listConversationsService(42);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("where user_id = $1"), [42]);
    expect(result).toEqual([{ id: 1, title: "New chat" }]);
  });
});

describe("getConversationService", () => {
  it("throws not found for a non-integer id", async () => {
    await expect(getConversationService(1, NaN)).rejects.toMatchObject({ status: 404 });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("throws not found when the conversation doesn't belong to the user", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(getConversationService(1, 99)).rejects.toMatchObject({ status: 404 });
  });

  it("returns the conversation with its messages", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 5, title: "Chat" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, role: "user", content: "hi" }] });

    const result = await getConversationService(1, 5);

    expect(result).toEqual({ id: 5, title: "Chat", messages: [{ id: 1, role: "user", content: "hi" }] });
  });
});

describe("deleteConversationService", () => {
  it("throws not found for a non-integer id", async () => {
    await expect(deleteConversationService(1, NaN)).rejects.toMatchObject({ status: 404 });
  });

  it("throws not found when nothing was deleted", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(deleteConversationService(1, 5)).rejects.toMatchObject({ status: 404 });
  });

  it("resolves when a row was deleted", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 5 }] });
    await expect(deleteConversationService(1, 5)).resolves.toBeUndefined();
  });
});

describe("startExchangeService", () => {
  const makeClient = () => ({
    query: vi.fn(),
    release: vi.fn(),
  });

  it("rolls back and releases the client when the conversation isn't found", async () => {
    const client = makeClient();
    connectMock.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce(undefined) // begin
      .mockResolvedValueOnce({ rows: [] }); // update ... returning id -> not found

    await expect(startExchangeService(1, 5, "hello")).rejects.toMatchObject({ status: 404 });

    expect(client.query).toHaveBeenCalledWith("rollback");
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("commits and releases the client on success", async () => {
    const client = makeClient();
    connectMock.mockResolvedValueOnce(client);
    client.query
      .mockResolvedValueOnce(undefined) // begin
      .mockResolvedValueOnce({ rows: [{ id: 10 }] }) // insert conversation
      .mockResolvedValueOnce({ rows: [{ id: 1, role: "user", content: "hi" }] }) // insert message
      .mockResolvedValueOnce({ rows: [{ id: 10, title: "hi" }] }) // select conversation
      .mockResolvedValueOnce(undefined); // commit

    const result = await startExchangeService(1, undefined, "hi");

    expect(result.conversation).toEqual({ id: 10, title: "hi" });
    expect(result.userMessage).toEqual({ id: 1, role: "user", content: "hi" });
    expect(client.query).toHaveBeenCalledWith("commit");
    expect(client.release).toHaveBeenCalledOnce();
  });
});
