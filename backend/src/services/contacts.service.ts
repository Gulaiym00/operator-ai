import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";

interface IContactBody {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
}

export const getContactsService = async (userId: number, search?: string) => {
  const res = await pool.query(
    `
    select id, name, email, phone, company, notes, created_at, updated_at
    from contacts
    where user_id = $1
      and ($2::text is null or name ilike '%' || $2 || '%' or company ilike '%' || $2 || '%')
    order by updated_at desc
    `,
    [userId, search || null],
  );

  return res.rows;
};

export const getContactService = async (userId: number, contactId: number) => {
  const res = await pool.query(
    `
    select id, name, email, phone, company, notes, created_at, updated_at
    from contacts
    where id = $1 and user_id = $2
    `,
    [contactId, userId],
  );

  if (!res.rows[0]) throw apiErrors.notFaund("Contact not found");

  return res.rows[0];
};

export const createContactService = async (userId: number, body: IContactBody) => {
  if (!body.name?.trim()) throw apiErrors.badRequest("Name is required");

  const res = await pool.query(
    `
    insert into contacts
    (user_id, name, email, phone, company, notes)
    values ($1, $2, $3, $4, $5, $6)
    returning id, name, email, phone, company, notes, created_at, updated_at
    `,
    [userId, body.name, body.email || null, body.phone || null, body.company || null, body.notes || null],
  );

  return res.rows[0];
};

export const updateContactService = async (
  userId: number,
  contactId: number,
  body: IContactBody,
) => {
  const existing = await pool.query(
    `select * from contacts where id = $1 and user_id = $2`,
    [contactId, userId],
  );

  if (!existing.rows[0]) throw apiErrors.notFaund("Contact not found");
  const current = existing.rows[0];

  const res = await pool.query(
    `
    update contacts
    set name = $1, email = $2, phone = $3, company = $4, notes = $5, updated_at = now()
    where id = $6 and user_id = $7
    returning id, name, email, phone, company, notes, created_at, updated_at
    `,
    [
      body.name ?? current.name,
      body.email === undefined ? current.email : body.email,
      body.phone === undefined ? current.phone : body.phone,
      body.company === undefined ? current.company : body.company,
      body.notes === undefined ? current.notes : body.notes,
      contactId,
      userId,
    ],
  );

  return res.rows[0];
};

export const deleteContactService = async (userId: number, contactId: number) => {
  const res = await pool.query(
    `delete from contacts where id = $1 and user_id = $2 returning id`,
    [contactId, userId],
  );

  if (!res.rows[0]) throw apiErrors.notFaund("Contact not found");
};
