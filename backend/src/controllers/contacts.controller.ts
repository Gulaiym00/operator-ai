import { NextFunction, Request, Response } from "express";
import {
  createContactService,
  deleteContactService,
  getContactService,
  getContactsService,
  updateContactService,
} from "../services/contacts.service";

const getUserId = (req: Request) =>
  (req.user as { id?: number } | undefined)?.id as number;

export const getContactsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const result = await getContactsService(userId, search);

    res.status(200).json({ message: "Contacts", data: result });
  } catch (error) {
    next(error);
  }
};

export const getContactController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const result = await getContactService(userId, Number(req.params.id));

    res.status(200).json({ message: "Contact", data: result });
  } catch (error) {
    next(error);
  }
};

export const createContactController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const result = await createContactService(userId, req.body);

    res.status(201).json({ message: "Contact created", data: result });
  } catch (error) {
    next(error);
  }
};

export const updateContactController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    const result = await updateContactService(userId, Number(req.params.id), req.body);

    res.status(200).json({ message: "Contact updated", data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteContactController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserId(req);
    await deleteContactService(userId, Number(req.params.id));

    res.status(200).json({ message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
};
