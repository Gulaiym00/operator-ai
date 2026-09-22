import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";

type Status = "todo" | "progress" | "review" | "done";
type Priority = "low" | "medium" | "high";
type IssueType = "task" | "bug";

interface IIssueBody {
  title?: string | undefined;
  description?: string | undefined;
  status?: Status | undefined;
  priority?: Priority | undefined;
  type?: IssueType | undefined;
  sprint?: string | undefined;
  dueDate?: string | null | undefined;
}

const mapRow = (row: any) => ({
  id: row.id,
  key: `OP-${100 + row.id}`,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  type: row.type,
  sprint: row.sprint,
  dueDate: row.due_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getIssuesService = async (userId: number) => {
  const res = await pool.query(
    `select * from tasks where user_id = $1 order by created_at desc`,
    [userId],
  );
  return res.rows.map(mapRow);
};

export const createIssueService = async (userId: number, body: IIssueBody) => {
  const res = await pool.query(
    `
    insert into tasks
    (user_id, title, description, status, priority, type, sprint, due_date)
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    returning *
    `,
    [
      userId,
      body.title || "New task",
      body.description || "",
      body.status || "todo",
      body.priority || "medium",
      body.type || "task",
      body.sprint || "Sprint 1",
      body.dueDate || null,
    ],
  );

  return mapRow(res.rows[0]);
};

export const updateIssueService = async (
  userId: number,
  issueId: number,
  body: IIssueBody,
) => {
  const existing = await pool.query(
    `select * from tasks where id = $1 and user_id = $2`,
    [issueId, userId],
  );

  if (!existing.rows[0]) throw apiErrors.notFaund("Issue not found");
  const current = existing.rows[0];

  const res = await pool.query(
    `
    update tasks
    set title = $1, description = $2, status = $3, priority = $4,
        type = $5, sprint = $6, due_date = $7, updated_at = now()
    where id = $8 and user_id = $9
    returning *
    `,
    [
      body.title ?? current.title,
      body.description ?? current.description,
      body.status ?? current.status,
      body.priority ?? current.priority,
      body.type ?? current.type,
      body.sprint ?? current.sprint,
      body.dueDate === undefined ? current.due_date : body.dueDate,
      issueId,
      userId,
    ],
  );

  return mapRow(res.rows[0]);
};

export const deleteIssueService = async (userId: number, issueId: number) => {
  const res = await pool.query(
    `delete from tasks where id = $1 and user_id = $2 returning id`,
    [issueId, userId],
  );

  if (!res.rows[0]) throw apiErrors.notFaund("Issue not found");
};
