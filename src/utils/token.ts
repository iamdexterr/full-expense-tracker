import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

export const signToken = (userId: number) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
  }

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ||
      "7d") as NonNullable<SignOptions["expiresIn"]>,
  };

  const token = jwt.sign({ userId }, jwtSecret, options);
  return token;
};

export const verifyToken = (token: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
  }
  const { userId } = jwt.verify(token, jwtSecret) as {
    userId: number;
  };
  return userId;
};
