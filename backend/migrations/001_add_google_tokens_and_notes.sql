-- Google OAuth access/refresh tokens (needed for Gmail API calls).
-- Separate from users.refresh_token, which is our own app's JWT refresh token.
alter table users add column if not exists google_access text;
alter table users add column if not exists google_refresh text;

-- Notes feature storage (backend/src/services/notes.service.ts already queries this table).
create table if not exists notes (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  title text not null default 'Untitled note',
  content text not null default '',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists notes_user_id_idx on notes(user_id);
