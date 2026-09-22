-- Google-only accounts never set a password (Google OAuth doesn't provide one),
-- but the column was NOT NULL — a brand-new signup purely via Google crashed
-- on insert (see backend/src/config/authGoogle.ts's "create account" branch).
alter table users alter column password drop not null;
