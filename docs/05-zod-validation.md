# Zod Validation (input layer)

Validate user input *before* it reaches controllers/DB. **Prisma does NOT validate input** (unlike Mongoose) — Zod is the separate guard layer. "Zod guards the door, Prisma stores the data."

---

## Why a separate layer

| Layer | Tool | Job |
|---|---|---|
| Input validation | **Zod** | Is what the user sent well-formed? (types, ranges, required) |
| DB structure | **Prisma** | Store it in correctly-typed columns |
| Existence / business rules | **your code** | Does referenced data actually exist? (e.g. category exists) |

Zod checks **shape** (`is categoryId a positive int?`). It can't check **existence** (`does category 3 exist?`) — that stays a DB `findUnique` check.

---

## 1. Define schemas — one source of truth for create + update

```ts
// validators/expense.validator.ts
import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.number().positive("Amount must be greater than 0"),
  categoryId: z.number().int().positive(),
  date: z.string().datetime().optional(),
});

// update = same rules but partial + at least one field
export const updateExpenseSchema = createExpenseSchema
  .partial()                                            // every field optional
  .refine((d) => Object.keys(d).length > 0, {
    message: "Provide at least one field to update",
  });
```

**Key:** `.partial()` derives the update schema from the create schema → create/update rules can't drift apart. Solves the "create validated X but update didn't" class of bug.

Catches what manual `if (!x)` misses: `amount: -5`, `amount: "banana"`, `title: ""`, `title: <101 chars>`.

---

## 2. The reusable validate middleware (curried)

```ts
// middleware/validate.ts
import { AppError } from "../utils/AppError.js";
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const message = issue ? `${issue.path[0]}: ${issue.message}` : "Validation failed";
      return next(new AppError(422, message));   // ⚠️ (statusCode, message) — order matters!
    }
    // req.body = result.data;   // optional: replace with validated/typed data
    next();
  };

export default validate;
```

**Currying** — `(schema) => (req,res,next) => {}` is a function that returns middleware. Why: Express fixes the middleware signature to `(req,res,next)`, so you can't pass `schema` directly. The outer call `validate(schema)` runs at setup time and returns a middleware that "remembers" `schema` (a **closure**). One factory → infinite schema-specific validators. Same pattern as `authorize(role)`, `rateLimit(opts)`.

**`next(err)` vs `throw`:** in *synchronous* middleware (not wrapped in asyncHandler), use `next(new AppError(...))` — explicit and always forwarded to the error handler.

**`safeParse` vs `parse`:** `safeParse` returns `{ success, data|error }` (no throw); `parse` throws. Use `safeParse` in middleware.

---

## 3. Wire into routes — runs BEFORE the controller

```ts
router.post("/", validate(createExpenseSchema), createExpense);
router.put("/:id", validate(updateExpenseSchema), updateExpense);
```

Chain: request → `validate` → controller. Invalid input never reaches the controller.

---

## 4. Trim controllers

Delete manual `if (!title) ...` shape checks (Zod does them). **Keep** existence checks:
```ts
const category = await prisma.category.findUnique({ where: { id: categoryId } });
if (!category) throw new AppError(404, "Category not found");   // DB check — Zod can't do this
```

---

## Gotchas learned

- **Arg order bug:** `new AppError(message, 422)` when the constructor is `(statusCode, message)` → `res.status("some string")` → `TypeError: Invalid status code` → ugly 500. Always `new AppError(422, message)`.
- **Remove `console.log`** from middleware — runs on every request.
- **Numbers in JSON:** `z.number()` works because JSON `4.5` is a real number. If a value arrives as a string (query params, form data), use `z.coerce.number()` to coerce.
- **400 vs 422:** both valid for validation. `400` = malformed; `422` = well-formed but semantically invalid (more precise).

---

## Interview quick-hits

- **Why Zod if Prisma has a schema?** Prisma validates DB *structure*, not user *input*. Different layers.
- **Currying in middleware:** factory returns `(req,res,next)`; closure remembers the config (schema). Needed because Express fixes the middleware signature.
- **safeParse vs parse:** returns result object vs throws.
- **Shape vs existence:** Zod checks shape; DB `findUnique` checks existence.
- **`.partial()`:** derive an all-optional update schema from the create schema — one source of truth.
