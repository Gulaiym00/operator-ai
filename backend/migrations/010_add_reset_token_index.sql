-- resetPasswordService looks the user up by reset_token_hash on every
-- reset-link click — was a sequential scan.
create index if not exists users_reset_token_hash_idx on users(reset_token_hash);
