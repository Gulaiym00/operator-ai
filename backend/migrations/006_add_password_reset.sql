-- Password reset flow: store a hash of the reset token (never the raw token)
-- plus its expiry. The raw token only ever exists in the emailed link.
alter table users add column if not exists reset_token_hash text;
alter table users add column if not exists reset_token_expires timestamp;
