-- Simple admin flag for the "Users" directory (Operator AI's own registered
-- users, not CRM contacts). No RBAC system exists yet — this is a single
-- boolean gate, not a real permissions model.
alter table users add column if not exists is_admin boolean not null default false;

-- Make the real account owner the initial admin.
update users set is_admin = true where email = 'gulaiym274@gmail.com';
