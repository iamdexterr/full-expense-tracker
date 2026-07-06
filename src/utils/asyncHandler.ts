import type { Request, Response, NextFunction } from "express";

type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const asyncHandler = (fn: AsyncFn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next); // any thrown/rejected error → forwarded to error middleware
  };
};
