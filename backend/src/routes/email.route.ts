import { Router } from "express";
import {
  archiveEmailController,
  deleteEmailController,
  getEmailController,
  getEmailsController,
  sendEmailController,
  toggleStarController,
} from "../controllers/email.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateSchema } from "../middlewares/schema";
import { sendEmailSchema, toggleStarSchema } from "../schema/email";

const router = Router();

router.get("/", authMiddleware, getEmailsController);
router.get("/:id", authMiddleware, getEmailController);
router.post(
  "/send",
  authMiddleware,
  validateSchema(sendEmailSchema),
  sendEmailController,
);
router.patch(
  "/:id/star",
  authMiddleware,
  validateSchema(toggleStarSchema),
  toggleStarController,
);
router.patch("/:id/archive", authMiddleware, archiveEmailController);
router.delete("/:id", authMiddleware, deleteEmailController);

export default router;
