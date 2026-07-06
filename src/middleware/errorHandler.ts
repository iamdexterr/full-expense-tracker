import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

// 404 handler — for routes that don't exist
export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

// central error handler — MUST have 4 args (err first) for Express to recognize it
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // our own thrown errors carry a statusCode
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // anything unexpected → 500, log it, don't leak internals
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Internal server error" });
};
