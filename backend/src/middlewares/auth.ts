import { NextFunction, Request, Response } from "express";
import { apiErrors } from "../utils/apiErrors";
import jwt from "jsonwebtoken";
import { access_secret } from "../utils/generateToken";
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw apiErrors.unauthorized("unauthorized");
  const token = authHeader.split(" ")[1]; //Bearer Token
  if (!token) throw apiErrors.unauthorized("No token");
  let decoded;
  try {
    decoded = jwt.verify(token, access_secret);
  } catch {
    throw apiErrors.unauthorized("Token expired or invalid");
  }
  // req.user isn't typed by express's own types (only passport-registered
  // fields are) — every controller already reads it via a similar cast
  (req as Request & { user?: unknown }).user = decoded;
  next();
};
