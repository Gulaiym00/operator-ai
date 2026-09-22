import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../src/middlewares/errorHandler";

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("errorHandler", () => {
  it("uses the status/message from an apiErrors-shaped error", () => {
    const res = mockRes();
    errorHandler({ status: 404, message: "Not found" }, {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Not found" });
  });

  it("falls back to 500 for an unshaped error", () => {
    const res = mockRes();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(new Error("kaboom"), {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "kaboom" });
    consoleSpy.mockRestore();
  });

  it("falls back to a generic message when the error has none", () => {
    const res = mockRes();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler({}, {} as any, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    consoleSpy.mockRestore();
  });
});
