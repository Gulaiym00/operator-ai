import { NextFunction, Request, Response } from "express";
import { googleLoginService } from "../services/auth.service";

const frontendUrl = process.env.FRONTEND_URL as string;

export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as
      | { id: number; email: string; name: string; avatar: string }
      | undefined;

    if (!user) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    const tokens = await googleLoginService(user);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: false,
    });
    return res.redirect(
      `${frontendUrl}/google_success?accessToken=${tokens.accessToken}`,
    );
  } catch (error) {
    next(error);
  }
};
