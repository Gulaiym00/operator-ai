import { Router } from "express";
import {
  createIssueController,
  deleteIssueController,
  getIssuesController,
  updateIssueController,
} from "../controllers/tasks.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateSchema } from "../middlewares/schema";
import { createIssueSchema, updateIssueSchema } from "../schema/tasks";

const router = Router();

router.get("/", authMiddleware, getIssuesController);
router.post(
  "/",
  authMiddleware,
  validateSchema(createIssueSchema),
  createIssueController,
);
router.put(
  "/:id",
  authMiddleware,
  validateSchema(updateIssueSchema),
  updateIssueController,
);
router.delete("/:id", authMiddleware, deleteIssueController);

export default router;
