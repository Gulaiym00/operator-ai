import { NextFunction, Request, Response } from "express";
import { apiErrors } from "../utils/apiErrors";
import { pool } from "../plugins/pg";

// JWT-пейлоад (id/email/name) не содержит is_admin — флаг может смениться
// без перевыпуска токена, поэтому проверяем его в БД на каждый запрос
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req.user as { id?: number } | undefined)?.id;
    const res_ = await pool.query(`select is_admin from users where id = $1`, [
      userId,
    ]);

    if (!res_.rows[0]?.is_admin) throw apiErrors.forbidden("Admin access required");

    next();
  } catch (error) {
    next(error);
  }
};
