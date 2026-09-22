-- The base `users` table predates the migration system (created manually
-- early on) — this reconstructs it from the live schema so a fresh database
-- (e.g. a new Supabase/Neon project) has something for 001+ to alter.
create table if not exists users (
  id serial primary key,
  name varchar not null,
  email text not null unique,
  password text,
  google_id text,
  avatar text,
  refresh_token text,
  created_at timestamp default current_timestamp
);
