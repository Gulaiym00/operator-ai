-- Basic CRM module (backend/src/services/contacts.service.ts, deals.service.ts).
create table if not exists contacts (
  id serial primary key,
  user_id integer references users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists deals (
  id serial primary key,
  user_id integer references users(id) on delete cascade,
  contact_id integer references contacts(id) on delete set null,
  title text not null,
  amount numeric,
  stage text not null default 'new',
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists contacts_user_id_idx on contacts(user_id);
create index if not exists deals_user_id_idx on deals(user_id);
create index if not exists deals_contact_id_idx on deals(contact_id);
