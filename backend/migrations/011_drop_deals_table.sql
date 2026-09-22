-- "Deals" was removed from the app 2026-09-20 (page, hooks, API, chat tools) —
-- the table was left in place at the time in case the feature came back.
-- It never did, and nothing in the codebase references it anymore.
drop table if exists deals;
