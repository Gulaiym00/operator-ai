import { Router } from "express";
import {
  createNoteController,
  deleteNoteController,
  getNoteController,
  getNotesController,
  updateNoteController,
} from "../controllers/notes.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateSchema } from "../middlewares/schema";
import { createNoteSchema, updateNoteSchema } from "../schema/notes";

const router = Router();

router.get("/", authMiddleware, getNotesController);
router.get("/:id", authMiddleware, getNoteController);
router.post(
  "/",
  authMiddleware,
  validateSchema(createNoteSchema),
  createNoteController,
);
router.put(
  "/:id",
  authMiddleware,
  validateSchema(updateNoteSchema),
  updateNoteController,
);
router.delete("/:id", authMiddleware, deleteNoteController);

export default router;
