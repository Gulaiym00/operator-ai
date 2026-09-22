import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema } from "../../src/schema/auth";
import { createContactSchema, updateContactSchema } from "../../src/schema/contacts";
import { createNoteSchema } from "../../src/schema/notes";
import { createIssueSchema } from "../../src/schema/tasks";
import { chatSchema } from "../../src/schema/chat";
import { sendEmailSchema, toggleStarSchema as emailStarSchema } from "../../src/schema/email";
import { createEventSchema } from "../../src/schema/calendar";
import { toggleStarSchema as driveStarSchema } from "../../src/schema/drive";
import { updateProfileSchema } from "../../src/schema/profile";

describe("auth schema", () => {
  it("accepts a valid email for forgot-password", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a reset password shorter than 6 chars", () => {
    const result = resetPasswordSchema.safeParse({ token: "t", password: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid reset password payload", () => {
    const result = resetPasswordSchema.safeParse({ token: "t", password: "123456" });
    expect(result.success).toBe(true);
  });
});

describe("contacts schema", () => {
  it("requires a name on create", () => {
    expect(createContactSchema.safeParse({}).success).toBe(false);
  });

  it("allows an empty string or null email", () => {
    expect(createContactSchema.safeParse({ name: "Ada", email: "" }).success).toBe(true);
    expect(createContactSchema.safeParse({ name: "Ada", email: null }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(createContactSchema.safeParse({ name: "Ada", email: "nope" }).success).toBe(false);
  });

  it("allows an empty update payload (all fields optional)", () => {
    expect(updateContactSchema.safeParse({}).success).toBe(true);
  });
});

describe("notes schema", () => {
  it("allows an empty payload since title/content default server-side", () => {
    expect(createNoteSchema.safeParse({}).success).toBe(true);
  });

  it("rejects content over the 20000 char limit", () => {
    const result = createNoteSchema.safeParse({ content: "x".repeat(20001) });
    expect(result.success).toBe(false);
  });
});

describe("tasks schema", () => {
  it("rejects an unknown status value", () => {
    const result = createIssueSchema.safeParse({ status: "archived" });
    expect(result.success).toBe(false);
  });

  it("accepts a full valid payload", () => {
    const result = createIssueSchema.safeParse({
      title: "Fix bug",
      status: "progress",
      priority: "high",
      type: "bug",
    });
    expect(result.success).toBe(true);
  });
});

describe("chat schema", () => {
  it("rejects an empty message", () => {
    expect(chatSchema.safeParse({ message: "" }).success).toBe(false);
  });

  it("rejects a non-positive conversationId", () => {
    expect(chatSchema.safeParse({ message: "hi", conversationId: 0 }).success).toBe(false);
  });

  it("accepts a minimal valid payload", () => {
    expect(chatSchema.safeParse({ message: "hi" }).success).toBe(true);
  });
});

describe("email schema", () => {
  it("requires a valid recipient email and non-empty subject/body", () => {
    expect(
      sendEmailSchema.safeParse({ to: "not-an-email", subject: "hi", body: "x" }).success,
    ).toBe(false);
    expect(
      sendEmailSchema.safeParse({ to: "a@b.com", subject: "", body: "x" }).success,
    ).toBe(false);
    expect(
      sendEmailSchema.safeParse({ to: "a@b.com", subject: "hi", body: "x" }).success,
    ).toBe(true);
  });

  it("requires starred to be a boolean", () => {
    expect(emailStarSchema.safeParse({ starred: "yes" }).success).toBe(false);
    expect(emailStarSchema.safeParse({ starred: true }).success).toBe(true);
  });
});

describe("calendar schema", () => {
  it("requires title/start/end", () => {
    expect(createEventSchema.safeParse({}).success).toBe(false);
    expect(
      createEventSchema.safeParse({ title: "Meeting", start: "2026-01-01", end: "2026-01-02" })
        .success,
    ).toBe(true);
  });
});

describe("drive schema", () => {
  it("requires starred to be a boolean", () => {
    expect(driveStarSchema.safeParse({}).success).toBe(false);
    expect(driveStarSchema.safeParse({ starred: false }).success).toBe(true);
  });
});

describe("profile schema", () => {
  it("coerces a numeric string age and rejects out-of-range values", () => {
    expect(updateProfileSchema.safeParse({ age: "30" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ age: "200" }).success).toBe(false);
  });

  it("allows an empty payload", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });
});
