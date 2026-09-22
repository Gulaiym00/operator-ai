import { Router } from "express";
import {
  createContactController,
  deleteContactController,
  getContactController,
  getContactsController,
  updateContactController,
} from "../controllers/contacts.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateSchema } from "../middlewares/schema";
import { createContactSchema, updateContactSchema } from "../schema/contacts";

const router = Router();

router.get("/", authMiddleware, getContactsController);
router.get("/:id", authMiddleware, getContactController);
router.post(
  "/",
  authMiddleware,
  validateSchema(createContactSchema),
  createContactController,
);
router.put(
  "/:id",
  authMiddleware,
  validateSchema(updateContactSchema),
  updateContactController,
);
router.delete("/:id", authMiddleware, deleteContactController);

export default router;
