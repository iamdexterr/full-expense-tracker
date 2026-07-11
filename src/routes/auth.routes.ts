import { Router } from "express";
import validate from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { loginUser, registerUser } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

export default router;
