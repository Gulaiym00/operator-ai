import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const queryMock = vi.fn();

vi.mock("../../src/plugins/pg", () => ({
  pool: { query: (...args: any[]) => queryMock(...args) },
}));

vi.mock("../../src/config/mailer", () => ({
  mailer: { sendMail: vi.fn().mockResolvedValue(undefined) },
  mailFrom: "no-reply@test.local",
}));

import {
  registerService,
  loginService,
  refreshService,
  requestPasswordResetService,
} from "../../src/services/auth.service";
import { refresh_secret } from "../../src/utils/generateToken";

beforeEach(() => queryMock.mockReset());

describe("registerService", () => {
  it("stores a bcrypt hash, not the plaintext password", async () => {
    queryMock.mockImplementationOnce((_sql: string, params: any[]) => {
      expect(params[2]).not.toBe("plaintext123");
      expect(bcrypt.compareSync("plaintext123", params[2])).toBe(true);
      return { rows: [{ id: 1, name: "Ada", email: "ada@x.com" }] };
    });

    await registerService({ name: "Ada", email: "ada@x.com", password: "plaintext123", avatar: "" });
  });

  it("turns a unique-violation into a clean 409 conflict", async () => {
    queryMock.mockRejectedValueOnce({ code: "23505" });

    await expect(
      registerService({ name: "Ada", email: "dupe@x.com", password: "x", avatar: "" }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe("loginService", () => {
  it("rejects an unknown email", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(loginService({ email: "nope@x.com", password: "x" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("tells Google-only accounts (null password) to sign in with Google", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1, email: "g@x.com", password: null }] });
    await expect(loginService({ email: "g@x.com", password: "x" })).rejects.toMatchObject({
      message: expect.stringContaining("Google"),
    });
  });

  it("rejects a wrong password", async () => {
    const hash = await bcrypt.hash("correct", 8);
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1, email: "a@x.com", password: hash }] });
    await expect(loginService({ email: "a@x.com", password: "wrong" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("issues tokens and persists the refresh token on a correct password", async () => {
    const hash = await bcrypt.hash("correct", 8);
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 1, email: "a@x.com", name: "Ada", avatar: "", password: hash }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await loginService({ email: "a@x.com", password: "correct" });

    expect(result.user.email).toBe("a@x.com");
    expect(result.token.accessToken).toBeDefined();
    expect(queryMock).toHaveBeenLastCalledWith(expect.any(String), [
      result.token.refreshToken,
      "a@x.com",
    ]);
  });
});

describe("refreshService", () => {
  it("rejects when no token is given", async () => {
    await expect(refreshService("")).rejects.toMatchObject({ status: 401 });
  });

  it("rejects a token signed with the wrong secret", async () => {
    const badToken = jwt.sign({ email: "a@x.com" }, "wrong-secret");
    await expect(refreshService(badToken)).rejects.toThrow();
  });

  it("rejects when the stored refresh token doesn't match (already rotated/revoked)", async () => {
    const token = jwt.sign({ id: 1, email: "a@x.com", name: "Ada" }, refresh_secret);
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1, email: "a@x.com", refresh_token: "different" }] });

    await expect(refreshService(token)).rejects.toMatchObject({ status: 401 });
  });

  it("rotates and returns a new token pair on success", async () => {
    const token = jwt.sign({ id: 1, email: "a@x.com", name: "Ada" }, refresh_secret);
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1, email: "a@x.com", name: "Ada", refresh_token: token }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await refreshService(token);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).not.toBe(token);
  });
});

describe("requestPasswordResetService", () => {
  it("does nothing (no token generated) for an unknown email", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await requestPasswordResetService("nobody@x.com");
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("does nothing for a Google-only account (no password)", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1, name: "Ada", password: null }] });
    await requestPasswordResetService("g@x.com");
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("generates and stores a hashed token for a real account", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Ada", password: "hash" }] })
      .mockResolvedValueOnce({ rows: [] });

    await requestPasswordResetService("a@x.com");

    expect(queryMock).toHaveBeenLastCalledWith(expect.any(String), expect.arrayContaining([1]));
  });
});
