import { AppError } from "../utils/AppError.js";
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const message = issue
        ? `${issue.path[0]}: ${issue.message}`
        : "Validation failed";
      return next(new AppError(422, message));
    }
    next();
  };

export default validate;
