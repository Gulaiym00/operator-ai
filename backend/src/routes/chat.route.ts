import { Router } from "express";
import {
  deleteConversationController,
  getConversationController,
  listConversationsController,
  sendChatController,
} from "../controllers/chat.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateSchema } from "../middlewares/schema";
import { chatSchema } from "../schema/chat";

const router = Router();

// authMiddleware — только залогиненные пользователи могут писать AI Operator-у
router.post("/", authMiddleware, validateSchema(chatSchema), sendChatController);

router.get("/conversations", authMiddleware, listConversationsController);
router.get("/conversations/:id", authMiddleware, getConversationController);
router.delete("/conversations/:id", authMiddleware, deleteConversationController);

export default router;
