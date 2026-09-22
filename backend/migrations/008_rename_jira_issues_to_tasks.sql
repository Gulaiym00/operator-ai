-- The kanban board is now called "Tasks" (it was never a real Jira integration).
-- Pure rename: rows and constraints are untouched.
alter table if exists jira_issues rename to tasks;
alter index if exists jira_issues_user_id_idx rename to tasks_user_id_idx;
