import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { generateToken, access_secret, refresh_secret } from "../../src/utils/generateToken";

describe("generateToken", () => {
  const payload = { id: 1, name: "Ada", email: "ada@example.com" };

  it("signs an access token verifiable with the access secret", () => {
    const { accessToken } = generateToken(payload);
    const decoded = jwt.verify(accessToken, access_secret) as jwt.JwtPayload;
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
  });

  it("signs a refresh token verifiable with the refresh secret", () => {
    const { refreshToken } = generateToken(payload);
    const decoded = jwt.verify(refreshToken, refresh_secret) as jwt.JwtPayload;
    expect(decoded.name).toBe(payload.name);
  });

  it("rejects the access token against the refresh secret and vice versa", () => {
    const { accessToken, refreshToken } = generateToken(payload);
    expect(() => jwt.verify(accessToken, refresh_secret)).toThrow();
    expect(() => jwt.verify(refreshToken, access_secret)).toThrow();
  });

  it("sets different expiries for access (15m) and refresh (7d) tokens", () => {
    const { accessToken, refreshToken } = generateToken(payload);
    const access = jwt.decode(accessToken) as jwt.JwtPayload;
    const refresh = jwt.decode(refreshToken) as jwt.JwtPayload;
    const accessTtl = access.exp! - access.iat!;
    const refreshTtl = refresh.exp! - refresh.iat!;
    expect(accessTtl).toBe(15 * 60);
    expect(refreshTtl).toBe(7 * 24 * 60 * 60);
  });
});
