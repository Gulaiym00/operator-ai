import { NextFunction, Request, Response } from "express";
import { getAllUsersService } from "../services/adminUsers.service";

export const getAllUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getAllUsersService();

    res.status(200).json({ message: "Users", data: result });
  } catch (error) {
    next(error);
  }
};
