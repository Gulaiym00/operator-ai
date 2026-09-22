import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { apiErrors } from "../utils/apiErrors";

export const validateSchema =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw apiErrors.badRequest(result.error.issues[0]?.message || "Invalid request body");
    }

    req.body = result.data;
    next();
  };
