import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";
import validate from "../middleware/validate.js";

const router = Router();

router.get("/", listCategories);
router.get("/:id", getCategory);
router.post("/", validate(createCategorySchema), createCategory); // ← added
router.put("/:id", validate(updateCategorySchema), updateCategory); // ← added
router.delete("/:id", deleteCategory);

export default router;
