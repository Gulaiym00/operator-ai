import { CookieOptions } from "express";

// In prod, frontend (Vercel) and backend (Render) are on different domains —
// cross-site cookies need secure + sameSite=none, which browsers reject over
// plain HTTP, so this only kicks in when NODE_ENV=production (Render/Vercel
// both terminate TLS for us). Local dev keeps the old same-site behavior.
export const refreshCookieOptions: CookieOptions =
  process.env.NODE_ENV === "production"
    ? { httpOnly: true, secure: true, sameSite: "none" }
    : { httpOnly: true, secure: false };
