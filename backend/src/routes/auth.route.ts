import { Router } from "express";
import {
  forgotPasswordController,
  loginController,
  logoutController,
  profileController,
  refreshController,
  registerController,
  resetPasswordController,
  updateProfileController,
} from "../controllers/auth.controller";
import { uploadMiddleware } from "../middlewares/upload";
import { authMiddleware } from "../middlewares/auth";
import { validateSchema } from "../middlewares/schema";
import { updateProfileSchema } from "../schema/profile";
import { forgotPasswordSchema, resetPasswordSchema } from "../schema/auth";
import passport from "passport";
import { googleCallback } from "../middlewares/googleCallBack";

const router = Router();
router.post("/register", uploadMiddleware.single("avatar"), registerController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.get("/profile", authMiddleware, profileController);
router.put(
  "/profile",
  authMiddleware,
  uploadMiddleware.single("avatar"),
  validateSchema(updateProfileSchema),
  updateProfileController,
);
router.post("/logout", logoutController);
router.post(
  "/forgot-password",
  validateSchema(forgotPasswordSchema),
  forgotPasswordController,
);
router.post(
  "/reset-password",
  validateSchema(resetPasswordSchema),
  resetPasswordController,
);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/drive.metadata",
    ],
    // offline + consent — иначе Google не выдаст refresh_token
    // (нужен, чтобы читать Gmail, когда access_token истёк)
    accessType: "offline",
    prompt: "consent",
  }),
);
router.get(
  "/google-callback",
  passport.authenticate("google", {
    session: false,
  }),
  googleCallback,
);
// router.post("/google-me",);
export default router;
