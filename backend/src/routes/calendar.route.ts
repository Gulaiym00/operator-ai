import { Router } from "express";
import {
  createEventController,
  deleteEventController,
  getEventsController,
} from "../controllers/calendar.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateSchema } from "../middlewares/schema";
import { createEventSchema } from "../schema/calendar";

const router = Router();

router.get("/", authMiddleware, getEventsController);
router.post(
  "/",
  authMiddleware,
  validateSchema(createEventSchema),
  createEventController,
);
router.delete("/:id", authMiddleware, deleteEventController);

export default router;
