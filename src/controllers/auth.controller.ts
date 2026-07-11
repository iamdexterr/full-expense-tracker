import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { AppError } from "../utils/AppError.js";
import { signToken } from "../utils/token.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) throw new AppError(409, "User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
    omit: { password: true },
  });

  const token = signToken(user.id);

  res.status(201).json({
    data: user,
    message: "User created successfully",
    token,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new AppError(401, "Invalid credentials");
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) throw new AppError(401, "Invalid credentials");

  const token = signToken(user.id);
  const { password: _password, ...safeUser } = user;
  res.status(200).json({
    data: safeUser,
    message: "User logged in successfully",
    token,
  });
});
