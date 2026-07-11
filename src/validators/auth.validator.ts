import { z } from "zod";

// rules for REGISTER — all fields required (this is the sign-up form)
export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// rules for LOGIN — just check the fields are present.
// We don't re-enforce length/format here: an existing account might not
// match newer rules, and we don't want to hint which field was wrong.
export const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
