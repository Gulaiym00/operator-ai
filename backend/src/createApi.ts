import express from "express";
import { errorHandler } from "./middlewares/errorHandler";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route";
import chatRouter from "./routes/chat.route";
import notesRouter from "./routes/notes.route";
import emailRouter from "./routes/email.route";
import calendarRouter from "./routes/calendar.route";
import driveRouter from "./routes/drive.route";
import tasksRouter from "./routes/tasks.route";
import contactsRouter from "./routes/contacts.route";
import adminUsersRouter from "./routes/adminUsers.route";
import "./config/authGoogle";
import passport from "passport";
export const creatApi = () => {
  const app = express();
  // Render/Vercel sit behind a reverse proxy — needed for correct req.ip
  // and for Express to recognize the connection as secure (X-Forwarded-Proto)
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    }),
  );
  // gzip для JSON-ответов (списки писем/файлов/диалогов) — заметно меньше трафика
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json());
  app.use(passport.initialize());
  app.use("/upload", express.static("src/upload"));
  app.use("/auth", authRouter);
  app.use("/chat", chatRouter);
  app.use("/notes", notesRouter);
  app.use("/email", emailRouter);
  app.use("/calendar", calendarRouter);
  app.use("/drive", driveRouter);
  app.use("/tasks", tasksRouter);
  app.use("/contacts", contactsRouter);
  app.use("/admin/users", adminUsersRouter);
  app.use(errorHandler);
  return app;
};
