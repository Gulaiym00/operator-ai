import { pool } from "../plugins/pg";

export const getAllUsersService = async () => {
  const res = await pool.query(
    `select id, name, email, avatar, age, phone,
      google_id is not null as has_google, is_admin, created_at
    from users
    order by created_at desc`,
  );

  return res.rows;
};
