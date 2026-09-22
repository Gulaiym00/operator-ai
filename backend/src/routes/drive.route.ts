import { Router } from "express";
import {
  getFilesController,
  toggleStarController,
  trashFileController,
} from "../controllers/drive.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateSchema } from "../middlewares/schema";
import { toggleStarSchema } from "../schema/drive";

const router = Router();

router.get("/", authMiddleware, getFilesController);
router.patch(
  "/:id/star",
  authMiddleware,
  validateSchema(toggleStarSchema),
  toggleStarController,
);
router.delete("/:id", authMiddleware, trashFileController);

export default router;
