import { NextFunction, Request, Response } from "express";
import {
  createEventService,
  deleteEventService,
  listEventsService,
} from "../services/calendar.service";

const getUserId = (req: Request) =>
  (req.user as { id?: number } | undefined)?.id as number;

export const getEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const timeMin =
      typeof req.query.timeMin === "string" ? req.query.timeMin : undefined;
    const timeMax =
      typeof req.query.timeMax === "string" ? req.query.timeMax : undefined;

    if (!timeMin || !timeMax) {
      res.status(400).json({ message: "timeMin and timeMax are required" });
      return;
    }

    const events = await listEventsService(userId, { timeMin, timeMax });

    res.status(200).json({ message: "Events", data: events });
  } catch (error) {
    next(error);
  }
};

export const createEventController = async (
  req: Request<
    {},
    {},
    {
      title: string;
      description?: string;
      location?: string;
      start: string;
      end: string;
      allDay?: boolean;
    }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const event = await createEventService(userId, req.body);

    res.status(201).json({ message: "Event created", data: event });
  } catch (error) {
    next(error);
  }
};

export const deleteEventController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    await deleteEventService(userId, req.params.id);

    res.status(200).json({ message: "Event deleted" });
  } catch (error) {
    next(error);
  }
};
