import { describe, expect, it, vi, beforeEach } from "vitest";

const queryMock = vi.fn();

vi.mock("../../src/plugins/pg", () => ({
  pool: { query: (...args: any[]) => queryMock(...args) },
}));

import {
  getNoteService,
  createNoteService,
  updateNoteService,
  deleteNoteService,
} from "../../src/services/notes.service";

beforeEach(() => queryMock.mockReset());

describe("getNoteService", () => {
  it("throws not found when no row matches", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(getNoteService(1, 5)).rejects.toMatchObject({ status: 404 });
  });
});

describe("createNoteService", () => {
  it("defaults title/content when omitted", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    await createNoteService(1, {});
    expect(queryMock).toHaveBeenCalledWith(expect.any(String), [1, "Untitled note", ""]);
  });
});

describe("updateNoteService", () => {
  it("throws not found before issuing the update when the note is missing", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(updateNoteService(1, 5, { title: "x" })).rejects.toMatchObject({ status: 404 });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the existing content when only the title changes", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 5, title: "Old", content: "body" }] })
      .mockResolvedValueOnce({ rows: [{ id: 5, title: "New", content: "body" }] });

    await updateNoteService(1, 5, { title: "New" });

    expect(queryMock).toHaveBeenLastCalledWith(expect.any(String), ["New", "body", 5, 1]);
  });
});

describe("deleteNoteService", () => {
  it("throws not found when nothing was deleted", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(deleteNoteService(1, 5)).rejects.toMatchObject({ status: 404 });
  });
});
