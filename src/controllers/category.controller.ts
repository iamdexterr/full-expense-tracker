import { prisma } from "../db.js";
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const listCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await prisma.category.findMany();

    res.status(200).json({
      data: categories,
      message: "Categories retrieved successfully",
    });
  },
);

export const getCategory = asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.id);
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw new AppError(404, "Category not found");

  res.status(200).json({
    data: category,
    message: "Category retrieved successfully",
  });
});
export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) throw new AppError(400, "Category name is required");

  const category = await prisma.category.create({
    data: { name },
  });

  res.status(201).json({
    data: category,
    message: "Category created successfully",
  });
});
export const updateCategory = asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.id);
  const { name } = req.body;
  if (!name) throw new AppError(400, "Category name is required");

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
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

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
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
