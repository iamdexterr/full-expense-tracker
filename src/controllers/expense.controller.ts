import { prisma } from "../db.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listExpenses = asyncHandler(async (req, res) => {
  const userId = req.userId!;
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
    include: {
      category: true,
    },
  });

  res.status(200).json({
    data: expenses,
    message: "Expenses retrieved successfully",
  });
});

export const getExpense = asyncHandler(async (req, res) => {
  const expenseId = Number(req.params.id);
  const userId = req.userId!;

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
    include: {
      category: true,
    },
  });
  if (!expense) throw new AppError(404, "Expense not found");
  res.status(200).json({
    data: expense,
    message: "Expense retrieved successfully",
  });
});

export const createExpense = asyncHandler(async (req, res) => {
  const userId = req.userId!;
  const { title, amount, date, categoryId } = req.body;

  const category = await prisma.category.findUnique({
    where: { id: Number(categoryId) },
  });

  if (!category) throw new AppError(404, "Category not found");

  const expense = await prisma.expense.create({
    data: {
      title,
      amount,
      date,
      categoryId: Number(categoryId),
      userId: userId,
    },
    include: {
      category: true,
    },
  });

  res.status(201).json({
    data: expense,
    message: "Expense created successfully",
  });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expenseId = Number(req.params.id);
  const { title, amount, date, categoryId } = req.body;
  const userId = req.userId!;

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!expense) throw new AppError(404, "Expense not found");

  const category = await prisma.category.findUnique({
    where: { id: Number(categoryId) },
  });

  if (!category) throw new AppError(404, "Category not found");

  const updatedExpense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      title,
      amount,
      date,
      categoryId: Number(categoryId),
    },
    include: {
      category: true,
    },
  });
  res.status(200).json({
    data: updatedExpense,
    message: "Expense updated successfully",
  });
});

export const deleteExpenses = asyncHandler(async (req, res) => {
  const expenseId = Number(req.params.id);
  const userId = req.userId!;

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!expense) throw new AppError(404, "Expense not found");

  await prisma.expense.delete({
    where: { id: expenseId },
  });
  res.status(200).json({
    data: expense,
    message: "Expense deleted successfully",
  });
});
