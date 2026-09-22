-- Persistent chat history (ChatGPT/Claude-style conversations).
create table if not exists chat_conversations (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

-- sidebar list: "my conversations, newest first"
create index if not exists chat_conversations_user_updated_idx
  on chat_conversations(user_id, updated_at desc);

create table if not exists chat_messages (
  id serial primary key,
  conversation_id integer not null references chat_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp not null default now()
);

-- loading a conversation / its last N messages
create index if not exists chat_messages_conversation_idx
  on chat_messages(conversation_id, id);

-- /auth/profile looks the user up by refresh_token on every page load,
-- and Google sign-in looks up by google_id — both were sequential scans.
create index if not exists users_refresh_token_idx on users(refresh_token);
create index if not exists users_google_id_idx on users(google_id);
