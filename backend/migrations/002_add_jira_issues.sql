-- Self-contained Jira-style kanban board (backend/src/services/jira.service.ts).
-- Not a real Atlassian Jira integration — per-user issues stored in our own DB.
create table if not exists jira_issues (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  type text not null default 'task' check (type in ('task', 'bug')),
  sprint text not null default 'Sprint 1',
  due_date date,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists jira_issues_user_id_idx on jira_issues(user_id);
