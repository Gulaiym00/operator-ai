import { Router } from "express";
import { getAllUsersController } from "../controllers/adminUsers.controller";
import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/admin";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, getAllUsersController);

export default router;
