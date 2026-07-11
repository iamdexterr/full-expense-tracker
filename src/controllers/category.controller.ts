import { prisma } from "../db.js";
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const listCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }], // predefined globals + your own
      },
      orderBy: { name: "asc" },
    });

    res.status(200).json({
      data: categories,
      message: "Categories retrieved successfully",
    });
  },
);

export const getCategory = asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.id);
  const userId = req.userId!;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId: null }, { userId }] },
  });
  if (!category) throw new AppError(404, "Category not found");

  res.status(200).json({
    data: category,
    message: "Category retrieved successfully",
  });
});
export const createCategory = asyncHandler(async (req, res) => {
  const userId = req.userId!;
  const { name } = req.body;

  const category = await prisma.category.create({
    data: { name, userId },
  });

  res.status(201).json({
    data: category,
    message: "Category created successfully",
  });
});
export const updateCategory = asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.id);
  const { name } = req.body;
  const userId = req.userId!;

  const existingCategory = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
  if (!existingCategory) throw new AppError(404, "Category not found");

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: { name },
  });

  res.status(200).json({
    data: category,
    message: "Category updated successfully",
  });
});
export const deleteCategory = asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.id);
  const userId = req.userId!;
  const existing = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
  if (!existing) throw new AppError(404, "Category not found");
  const category = await prisma.category.delete({
    where: { id: categoryId },
  });

  res.status(200).json({
    data: category,
    message: "Category deleted successfully",
  });
});
