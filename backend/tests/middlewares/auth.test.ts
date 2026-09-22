import { describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../../src/middlewares/auth";
import { access_secret } from "../../src/utils/generateToken";

describe("authMiddleware", () => {
  it("throws unauthorized when there is no Authorization header", () => {
    const req: any = { headers: {} };
    expect(() => authMiddleware(req, {} as any, vi.fn())).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });

  it("throws unauthorized when the header has no token", () => {
    const req: any = { headers: { authorization: "Bearer" } };
    expect(() => authMiddleware(req, {} as any, vi.fn())).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });

  it("throws unauthorized for an invalid/expired token", () => {
    const req: any = { headers: { authorization: "Bearer not-a-real-token" } };
    expect(() => authMiddleware(req, {} as any, vi.fn())).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });

  it("attaches the decoded payload to req.user and calls next for a valid token", () => {
    const token = jwt.sign({ id: 7, email: "a@b.com" }, access_secret);
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const next = vi.fn();

    authMiddleware(req, {} as any, next);

    expect(req.user.id).toBe(7);
    expect(next).toHaveBeenCalledOnce();
  });
});
