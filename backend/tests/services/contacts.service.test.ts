import { describe, expect, it, vi, beforeEach } from "vitest";

const queryMock = vi.fn();

vi.mock("../../src/plugins/pg", () => ({
  pool: { query: (...args: any[]) => queryMock(...args) },
}));

import {
  getContactsService,
  createContactService,
  updateContactService,
  deleteContactService,
} from "../../src/services/contacts.service";

beforeEach(() => queryMock.mockReset());

describe("getContactsService", () => {
  it("passes null as the search param when no search string is given", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await getContactsService(7);
    expect(queryMock).toHaveBeenCalledWith(expect.any(String), [7, null]);
  });

  it("passes the search string through untouched (ILIKE wildcards live in SQL)", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await getContactsService(7, "acme");
    expect(queryMock).toHaveBeenCalledWith(expect.any(String), [7, "acme"]);
  });
});

describe("createContactService", () => {
  it("rejects a blank name before touching the database", async () => {
    await expect(createContactService(1, { name: "   " })).rejects.toMatchObject({ status: 400 });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("defaults optional fields to null", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1, name: "Ada" }] });
    await createContactService(1, { name: "Ada" });
    expect(queryMock).toHaveBeenCalledWith(expect.any(String), [1, "Ada", null, null, null, null]);
  });
});

describe("updateContactService", () => {
  it("throws not found when the contact doesn't belong to the user", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(updateContactService(1, 5, { name: "New" })).rejects.toMatchObject({ status: 404 });
  });

  it("keeps existing fields when the body omits them", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 5, name: "Old", email: "old@x.com", phone: null, company: null, notes: null }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 5, name: "Old" }] });

    await updateContactService(1, 5, { email: "new@x.com" });

    expect(queryMock).toHaveBeenLastCalledWith(expect.any(String), [
      "Old",
      "new@x.com",
      null,
      null,
      null,
      5,
      1,
    ]);
  });
});

describe("deleteContactService", () => {
  it("throws not found when nothing was deleted", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(deleteContactService(1, 5)).rejects.toMatchObject({ status: 404 });
  });
});
