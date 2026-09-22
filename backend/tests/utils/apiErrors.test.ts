import { describe, expect, it } from "vitest";
import { apiErrors } from "../../src/utils/apiErrors";

describe("apiErrors", () => {
  it.each([
    ["badRequest", 400],
    ["unauthorized", 401],
    ["noContent", 402],
    ["forbidden", 403],
    ["notFaund", 404],
    ["conflict", 409],
  ] as const)("%s returns status %d with the given message", (fn, status) => {
    const result = apiErrors[fn]("boom");
    expect(result).toEqual({ message: "boom", status });
  });
});
