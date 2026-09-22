import { NextFunction, Request, Response } from "express";
import {
  listFilesService,
  toggleStarService,
  trashFileService,
} from "../services/drive.service";

const getUserId = (req: Request) =>
  (req.user as { id?: number } | undefined)?.id as number;

export const getFilesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const folderId =
      typeof req.query.folderId === "string" ? req.query.folderId : undefined;
    const query = typeof req.query.q === "string" ? req.query.q : undefined;
    const starredOnly = req.query.starred === "true";
    const pageToken =
      typeof req.query.pageToken === "string" ? req.query.pageToken : undefined;

    const result = await listFilesService(userId, {
      folderId,
      query,
      starredOnly,
      pageToken,
    });

    res.status(200).json({ message: "Files", data: result });
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

export const trashFileController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    await trashFileService(userId, req.params.id);

    res.status(200).json({ message: "Moved to trash" });
  } catch (error) {
    next(error);
  }
};
