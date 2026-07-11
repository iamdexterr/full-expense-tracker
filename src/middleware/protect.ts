import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/token.js";
import type { Request, Response, NextFunction } from "express";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Not authenticated"));
  }

  const token = header.split(" ")[1];
  if (!token) {
    return next(new AppError(401, "Not authenticated"));
  }

  try {
    const userId = verifyToken(token);
    req.userId = userId;
    next();
  } catch (error) {
    next(new AppError(401, "Invalid or expired token"));
  }
};
