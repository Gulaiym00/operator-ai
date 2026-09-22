import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../plugins/pg";
import { apiErrors } from "../utils/apiErrors";
import { generateToken, refresh_secret } from "../utils/generateToken";
import jwt from "jsonwebtoken";
import { mailer, mailFrom } from "../config/mailer";

interface IBody {
  name: string;
  email: string;
  password: string;
  avatar: string;
}
interface ILoginBody {
  email: string;
  password: string;
}

export const registerService = async (body: IBody) => {
  const hashedPassword = await bcrypt.hash(body.password, 8);

  try {
    const res = await pool.query(
      `
      insert into users
      (name, email, password, avatar)
      values($1, $2, $3, $4)
      returning name, email, id,avatar, created_at
      `,
      [body.name, body.email, hashedPassword, body.avatar],
    );
    return res.rows[0];
  } catch (error: any) {
    // 23505 = unique_violation — email уже занят (в т.ч. аккаунтом,
    // созданным через Google) — отдаём понятную ошибку вместо сырой из БД
    if (error?.code === "23505") {
      throw apiErrors.conflict("This email is already registered. Try signing in instead.");
    }
    throw error;
  }
};
export const loginService = async (body: ILoginBody) => {
  const res = await pool.query(
    `
    select * from users
    where email = $1
    `,
    [body.email],
  );
  if (!res.rows[0]) throw apiErrors.badRequest("Wrong email or password");

  // аккаунт создан только через Google — пароля никогда не было
  if (!res.rows[0].password) {
    throw apiErrors.badRequest(
      "This account uses Google sign-in. Please continue with Google instead.",
    );
  }

  const isMatchedPassword = await bcrypt.compare(
    body.password,
    res.rows[0].password,
  );

  if (!isMatchedPassword) throw apiErrors.badRequest("Wrong email or password");
  const tokens = generateToken({
    id: res.rows[0].id,
    email: res.rows[0].email,
    name: res.rows[0].name,
  });

  await pool.query(
    `
    update  users
    set refresh_token = $1
    where email = $2
    `,
    [tokens.refreshToken, body.email],
  );
  return {
    user: {
      email: body.email,
      id: res.rows[0].id,
      avatar: res.rows[0].avatar,
      name: res.rows[0].name,
      is_admin: res.rows[0].is_admin,
    },
    token: tokens,
  };
};
export const googleLoginService = async (user: {
  id: number;
  email: string;
  name: string;
  avatar: string;
}) => {
  const tokens = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  await pool.query(
    `
    update users
    set refresh_token = $1
    where id = $2
    `,
    [tokens.refreshToken, user.id],
  );

  return tokens;
};

export const refreshService = async (refreshToken: string) => {
  //!refresh
  if (!refreshToken) throw apiErrors.unauthorized("unauthorized");
  //jwt.verify()
  let decoded: any;
  decoded = jwt.verify(refreshToken, refresh_secret);
  const res = await pool.query(
    `
   select * from users
   where email = $1
    `,
    [decoded.email],
  );
  if (!res.rows[0] || res.rows[0].refresh_token !== refreshToken)
    throw apiErrors.unauthorized("unauthorized");
  //rotate
  const tokens = generateToken({
    id: res.rows[0].id,
    name: res.rows[0].name,
    email: res.rows[0].email,
  });
  await pool.query(
    `
    update users
    set refresh_token=$1
    where email=$2`,
    [tokens.refreshToken, decoded.email],
  );
  //
  return tokens;
};
export const profileService = async (refreshToken: string) => {
  if (!refreshToken) throw apiErrors.unauthorized("unauthorized");

  const res = await pool.query(
    `select name, email, avatar, id, google_id, created_at, age, phone, is_admin from users
    where refresh_token = $1`,
    [refreshToken],
  );

  if (!res.rows[0]) throw apiErrors.unauthorized("unauthorized");

  return res.rows[0];
};
export const updateProfileService = async (
  userId: number,
  body: {
    name?: string | undefined;
    avatar?: string | undefined;
    age?: number | null | undefined;
    phone?: string | null | undefined;
  },
) => {
  const existing = await pool.query(
    `select name, avatar, age, phone from users where id = $1`,
    [userId],
  );

  if (!existing.rows[0]) throw apiErrors.notFaund("User not found");

  const res = await pool.query(
    `
    update users
    set name = $1, avatar = $2, age = $3, phone = $4
    where id = $5
    returning name, email, avatar, id, google_id, created_at, age, phone, is_admin
    `,
    [
      body.name ?? existing.rows[0].name,
      body.avatar ?? existing.rows[0].avatar,
      body.age === undefined ? existing.rows[0].age : body.age,
      body.phone === undefined ? existing.rows[0].phone : body.phone,
      userId,
    ],
  );

  return res.rows[0];
};
const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const requestPasswordResetService = async (email: string) => {
  const res = await pool.query(`select id, name, password from users where email = $1`, [
    email,
  ]);
  const user = res.rows[0];

  // всегда отвечаем одинаково независимо от того, нашли пользователя или
  // есть ли у него пароль — иначе можно перебором узнать, какие email
  // зарегистрированы (email enumeration)
  if (!user || !user.password) return;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 час

  await pool.query(
    `update users set reset_token_hash = $1, reset_token_expires = $2 where id = $3`,
    [hashToken(rawToken), expires, user.id],
  );

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  try {
    await mailer.sendMail({
      from: mailFrom,
      to: email,
      subject: "Reset your Operator AI password",
      text: `Hi ${user.name},\n\nWe received a request to reset your password. This link expires in 1 hour:\n\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `<p>Hi ${user.name},</p><p>We received a request to reset your password. This link expires in 1 hour:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
    });
  } catch (error) {
    // не роняем запрос из-за проблем с почтовым сервером — токен уже
    // сохранён, письмо можно будет донастроить/переслать позже
    console.error("Failed to send password reset email:", error);
  }
};

export const resetPasswordService = async (token: string, newPassword: string) => {
  const res = await pool.query(
    `select id from users where reset_token_hash = $1 and reset_token_expires > now()`,
    [hashToken(token)],
  );
  const user = res.rows[0];

  if (!user) throw apiErrors.badRequest("This reset link is invalid or has expired.");

  const hashedPassword = await bcrypt.hash(newPassword, 8);

  await pool.query(
    `
    update users
    set password = $1, reset_token_hash = null, reset_token_expires = null, refresh_token = null
    where id = $2
    `,
    [hashedPassword, user.id],
  );
};

export const logoutService = async (refreshToken: string) => {
  if (!refreshToken) return;

  const res = await pool.query(
    `
    update  users
    set refresh_token= null
    where refresh_token =$1`,
    [refreshToken],
  );
  res.rows[0];
};
