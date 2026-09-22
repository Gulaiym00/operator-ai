import { NextFunction, Request, Response } from "express";
import {
  loginService,
  logoutService,
  profileService,
  refreshService,
  registerService,
  requestPasswordResetService,
  resetPasswordService,
  updateProfileService,
} from "../services/auth.service";
import { access_secret } from "../utils/generateToken";
import { refreshCookieOptions } from "../utils/cookies";

export const registerController = async (
  req: Request<
    {},
    {},
    {
      email: string;
      password: string;
      avatar: any;
      name: string;
    }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body;
    const avatar = req.file ? `upload/${req.file.filename}` : "";
    const result = await registerService({ ...body, avatar });
    res.status(201).json({
      message: "Registired successfully",
      user: result,
    });
  } catch (error) {
    next(error);
  }
};
export const loginController = async (
  req: Request<
    {},
    {},
    {
      email: string;
      password: string;
      avatar: any;
      name: string;
    }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body;
    const { user, token } = await loginService(body);
    res.cookie("refreshToken", token.refreshToken, refreshCookieOptions);
    res.status(200).json({
      message: "Loggined successfully",
      user: {
        user: user,
        accessToken: token.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const refreshController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.refreshToken;
    const result = await refreshService(token);
    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
    res.status(200).json({
      message: "Refresh successfully done",
      token: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
};
export const profileController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.refreshToken;
    const result = await profileService(token);
    res.status(200).json({
      message: "Profile",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
export const updateProfileController = async (
  req: Request<{}, {}, { name?: string; age?: number; phone?: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req.user as { id?: number } | undefined)?.id as number;
    const avatar = req.file ? `upload/${req.file.filename}` : undefined;

    const result = await updateProfileService(userId, {
      name: req.body.name,
      avatar,
      age: req.body.age,
      phone: req.body.phone,
    });

    res.status(200).json({
      message: "Profile updated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
export const forgotPasswordController = async (
  req: Request<{}, {}, { email: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await requestPasswordResetService(req.body.email);
    // одинаковый ответ независимо от того, существует email — не даём
    // возможности перебором узнать, какие адреса зарегистрированы
    res.status(200).json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (
  req: Request<{}, {}, { token: string; password: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await resetPasswordService(req.body.token, req.body.password);
    res.status(200).json({ message: "Password updated. You can now sign in." });
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.refreshToken;
    await logoutService(token);
    res.clearCookie("refreshToken", refreshCookieOptions);

    res.status(200).json({
      message: "Logouted",
    });
  } catch (error) {
    next(error);
  }
};
