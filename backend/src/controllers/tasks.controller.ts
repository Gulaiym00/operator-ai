import { NextFunction, Request, Response } from "express";
import {
  createIssueService,
  deleteIssueService,
  getIssuesService,
  updateIssueService,
} from "../services/tasks.service";

const getUserId = (req: Request) =>
  (req.user as { id?: number } | undefined)?.id as number;

export const getIssuesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const result = await getIssuesService(userId);

    res.status(200).json({ message: "Issues", data: result });
  } catch (error) {
    next(error);
  }
};

export const createIssueController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const result = await createIssueService(userId, req.body);

    res.status(201).json({ message: "Issue created", data: result });
  } catch (error) {
    next(error);
  }
};

export const updateIssueController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const result = await updateIssueService(userId, Number(req.params.id), req.body);

    res.status(200).json({ message: "Issue updated", data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteIssueController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    await deleteIssueService(userId, Number(req.params.id));

    res.status(200).json({ message: "Issue deleted" });
  } catch (error) {
    next(error);
  }
};
