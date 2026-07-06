# Express Error Handling (reusable pattern)

Centralized error handling so controllers stay clean (no try/catch everywhere). **Boilerplate — copy into any Express project.** Understand the flow; reuse the code.

---

## The flow

```
controller throws OR crashes → asyncHandler catches (.catch(next)) → errorHandler → clean JSON response
```

- **Known error** (you `throw new AppError(404, ...)`) → that status + message.
- **Unknown error** (Prisma crash, bug, null ref — you didn't throw) → same net catches it → logged + generic 500 (no stack trace leaked).

---

## 1. AppError — custom error with a status code

```ts
// utils/AppError.ts
export class AppError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

## 2. asyncHandler — kills try/catch in every controller

```ts
// utils/asyncHandler.ts
import type { Request, Response, NextFunction } from "express";
type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);   // any throw/reject → forwarded to errorHandler
  };
```

## 3. errorHandler — one central catcher (MUST have 4 args)

```ts
// middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });   // known
  }
  console.error("Unexpected error:", err);                             // unknown: log for dev
  res.status(500).json({ error: "Internal server error" });           // generic for user
};
```

## 4. Wire into app.ts — AFTER all routes

```ts
app.use("/categories", categoryRoutes);
// ... other routes ...
app.use(notFound);       // no route matched
app.use(errorHandler);   // any error anywhere
```

---

## Usage in a controller

```ts
export const getCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: Number(req.params.id) } });
  if (!category) throw new AppError(404, "Category not found");   // clean, caught centrally
  res.json(category);
});
```

No try/catch. If Prisma throws OR you throw AppError, it flows to errorHandler.

---

## Key concepts (LEARN these — the code is copy-paste)

- **Operational errors** (expected: 404, 400, 401) → you `throw new AppError`. **Programmer errors** (bugs, crashes) → become logged 500s.
- **Express recognizes error middleware by its 4 args** `(err, req, res, next)`. 3 args = normal middleware. Common gotcha.
- **Error handlers go LAST** in app.ts, after all routes.
- **Never leak internal errors to the user** — log the detail server-side, send a generic message. Security.
- `asyncHandler` only catches inside the **async fn it wraps** — wrap every async controller.

## Learn vs reuse

| | Memorize? | |
|---|---|---|
| The concept (why centralized, throw vs unexpected, 500 vs 4xx) | ✅ yes | interview + real work |
| AppError / asyncHandler exact code | ❌ no | copy as boilerplate every project |

## Interview quick-hits

- **Why centralized error handling?** DRY, consistent responses, no leaked stack traces.
- **How does Express know it's an error handler?** 4 arguments `(err, req, res, next)`.
- **Operational vs programmer errors:** expected (throw AppError, 4xx) vs bugs (caught, 500).
- **asyncHandler:** wraps async controllers, `.catch(next)` forwards errors — removes try/catch.
