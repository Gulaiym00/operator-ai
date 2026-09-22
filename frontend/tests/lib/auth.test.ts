import { describe, expect, it, beforeEach } from "vitest";
import { getAccessToken, setAccessToken, clearAccessToken } from "@/lib/auth";

describe("auth token storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing is stored", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("stores and retrieves the access token", () => {
    setAccessToken("abc123");
    expect(getAccessToken()).toBe("abc123");
  });

  it("removes the token on clear", () => {
    setAccessToken("abc123");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
