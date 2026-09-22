import { google } from "googleapis";
import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";

// Общий OAuth2-клиент для Gmail/Calendar/Drive —
// одни и те же google_access/google_refresh токены на пользователя,
// разные API поверх одного и того же auth-объекта.
export const getGoogleAuthClient = async (userId: number) => {
  const userRow = await pool.query(
    `select google_access, google_refresh from users where id = $1`,
    [userId],
  );
  const user = userRow.rows[0];

  if (!user?.google_refresh) {
    throw apiErrors.badRequest("Google account is not connected");
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  auth.setCredentials({
    access_token: user.google_access,
    refresh_token: user.google_refresh,
  });

  // Google-клиент сам обновляет access_token по refresh_token —
  // сохраняем обновлённые токены, чтобы не терять их между запросами
  auth.on("tokens", (tokens) => {
    pool
      .query(
        `update users
         set google_access = coalesce($1, google_access),
             google_refresh = coalesce($2, google_refresh)
         where id = $3`,
        [tokens.access_token ?? null, tokens.refresh_token ?? null, userId],
      )
      .catch((error) => console.error("Failed to persist google tokens", error));
  });

  return auth;
};
