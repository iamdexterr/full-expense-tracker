import { Router } from "express";
import {
  createExpense,
  deleteExpenses,
  getExpense,
  listExpenses,
  updateExpense,
} from "../controllers/expense.controller.js";
import validate from "../middleware/validate.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "../validators/expense.validator.js";

const router = Router();

router.get("/", listExpenses);
router.get("/:id", getExpense);
router.post("/", validate(createExpenseSchema), createExpense); // ← validate runs first
router.put("/:id", validate(updateExpenseSchema), updateExpense); // ← validate runs first
router.delete("/:id", deleteExpenses);

export default router;
