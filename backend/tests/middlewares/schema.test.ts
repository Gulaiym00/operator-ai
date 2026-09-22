import { describe, expect, it, vi } from "vitest";
import z from "zod";
import { validateSchema } from "../../src/middlewares/schema";

describe("validateSchema", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("calls next and replaces req.body with the parsed data on success", () => {
    const req: any = { body: { name: "Ada", extra: "dropped" } };
    const next = vi.fn();

    validateSchema(schema)(req, {} as any, next);

    expect(req.body).toEqual({ name: "Ada" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("throws a badRequest apiError with the first zod issue message on failure", () => {
    const req: any = { body: { name: "" } };

    expect(() => validateSchema(schema)(req, {} as any, vi.fn())).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });
});
