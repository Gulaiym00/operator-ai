import { NextFunction, Request, Response } from "express";
import {
  archiveEmailService,
  deleteEmailService,
  getEmailService,
  listEmailsService,
  sendEmailService,
  toggleStarService,
} from "../services/gmail.service";

const getUserId = (req: Request) =>
  (req.user as { id?: number } | undefined)?.id as number;

export const getEmailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const pageToken =
      typeof req.query.pageToken === "string" ? req.query.pageToken : undefined;
    const label = req.query.label === "STARRED" ? "STARRED" : "INBOX";

    const result = await listEmailsService(userId, { pageToken, label });

    res.status(200).json({
      message: "Emails",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmailController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const result = await getEmailService(userId, req.params.id);

    res.status(200).json({
      message: "Email",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sendEmailController = async (
  req: Request<
    {},
    {},
    {
      to: string;
      subject: string;
      body: string;
      threadId?: string;
      inReplyTo?: string;
      references?: string;
    }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const result = await sendEmailService(userId, req.body);

    res.status(201).json({
      message: "Email sent",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStarController = async (
  req: Request<{ id: string }, {}, { starred: boolean }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    await toggleStarService(userId, req.params.id, !!req.body.starred);

    res.status(200).json({ message: "Updated" });
  } catch (error) {
    next(error);
  }
};

export const archiveEmailController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    await archiveEmailService(userId, req.params.id);

    res.status(200).json({ message: "Archived" });
  } catch (error) {
    next(error);
  }
};

export const deleteEmailController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    await deleteEmailService(userId, req.params.id);

    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    next(error);
  }
};
