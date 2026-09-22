import { describe, expect, it, vi, beforeEach } from "vitest";

const queryMock = vi.fn();

vi.mock("../../src/plugins/pg", () => ({
  pool: { query: (...args: any[]) => queryMock(...args) },
}));

import {
  getIssuesService,
  createIssueService,
  updateIssueService,
  deleteIssueService,
} from "../../src/services/tasks.service";

beforeEach(() => queryMock.mockReset());

describe("getIssuesService", () => {
  it("maps db rows to the OP-<id> key shape", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 3,
          title: "Fix",
          description: "",
          status: "todo",
          priority: "medium",
          type: "task",
          sprint: "Sprint 1",
          due_date: null,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
      ],
    });

    const result = await getIssuesService(1);

    expect(result[0]).toMatchObject({ id: 3, key: "OP-103", dueDate: null });
  });
});

describe("createIssueService", () => {
  it("applies defaults for status/priority/type/sprint", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          title: "New task",
          description: "",
          status: "todo",
          priority: "medium",
          type: "task",
          sprint: "Sprint 1",
          due_date: null,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
      ],
    });

    await createIssueService(1, {});

    expect(queryMock).toHaveBeenCalledWith(expect.any(String), [
      1,
      "New task",
      "",
      "todo",
      "medium",
      "task",
      "Sprint 1",
      null,
    ]);
  });
});

describe("updateIssueService", () => {
  it("throws not found when the task doesn't belong to the user", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(updateIssueService(1, 9, { status: "done" })).rejects.toMatchObject({
      status: 404,
    });
  });

  it("allows explicitly clearing the due date with null", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 9,
            title: "T",
            description: "",
            status: "todo",
            priority: "medium",
            type: "task",
            sprint: "Sprint 1",
            due_date: "2026-01-01",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 9,
            title: "T",
            description: "",
            status: "todo",
            priority: "medium",
            type: "task",
            sprint: "Sprint 1",
            due_date: null,
            created_at: "x",
            updated_at: "x",
          },
        ],
      });

    await updateIssueService(1, 9, { dueDate: null });

    expect(queryMock).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.arrayContaining([null]),
    );
  });
});

describe("deleteIssueService", () => {
  it("throws not found when nothing was deleted", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(deleteIssueService(1, 9)).rejects.toMatchObject({ status: 404 });
  });
});
