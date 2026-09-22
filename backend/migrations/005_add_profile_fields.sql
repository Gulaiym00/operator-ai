-- Profile page: add age and phone number fields.
alter table users add column if not exists age integer;
alter table users add column if not exists phone text;
