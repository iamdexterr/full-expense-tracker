# Authentication (JWT + bcrypt)

Prove *who* a request is from, without the server storing sessions. Two libs: **bcrypt** (hash passwords) + **jsonwebtoken** (signed ID cards). "bcrypt guards the password, JWT proves the identity."

---

## The core problem

HTTP is **stateless** — the server forgets you after every request. So each request must re-prove identity. JWT does this by handing you a **signed token** at login that you carry and present on every request. Server verifies the signature → trusts the identity → stores nothing.

---

## The end-to-end flow

| Step | What happens |
|---|---|
| **Register** | Client sends `name,email,password` → server **hashes** password (bcrypt) → saves user. Raw password never stored. |
| **Login** | Client sends `email,password` → server finds user → bcrypt **compares** → if match, `signToken(user.id)` → returns JWT. |
| **Store** | Frontend keeps the token (localStorage / cookie). Token = proof of identity. |
| **Protected request** | Client sends `Authorization: Bearer <token>` header on every call. |
| **protect middleware** | Extracts token → `verifyToken` → on success attaches `req.userId`, calls `next()`; on failure → `401`. |
| **Controller** | Uses `req.userId` (from the *verified token*, never the body) → scopes data: `where: { userId }`. |

---

## 1. Password hashing (bcrypt)

```ts
import bcrypt from "bcryptjs";

const hash = await bcrypt.hash(password, 10);     // register: store this
const ok   = await bcrypt.compare(password, hash); // login: true/false
```

- **One-way**: you can't un-hash. Login works by *hashing the attempt and comparing*, never by decrypting.
- **Salted**: same password → different hash each time (salt baked into the output). Stops rainbow-table attacks.
- **Slow on purpose**: the `10` = cost factor (2^10 rounds). Slow enough to make brute-force expensive, fast enough for a login. Higher = safer + slower.
- **Never store raw passwords.** Even a DB leak reveals nothing usable.

---

## 2. The token helper

```ts
// utils/token.ts
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET is not set");   // fail fast at startup

export const signToken = (userId: number) => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as NonNullable<SignOptions["expiresIn"]>,
  };
  return jwt.sign({ userId }, jwtSecret, options);
};

export const verifyToken = (token: string) => {
  const { userId } = jwt.verify(token, jwtSecret) as { userId: number };
  return userId;
};
```

- **sign** = pack payload `{ userId }` + stamp with secret + expiry → tamper-proof string.
- **verify** = recompute signature with the secret; matches → return payload; tampered/expired → **throws**.
- Payload is tiny (just `userId`) — never put the password or secrets in it (payload is readable by anyone).

---

## 3. What a JWT actually is

Three base64 parts: `header.payload.signature`.

- **Payload is NOT encrypted** — anyone can decode and read `{ userId: 5 }`. That's fine; it isn't secret.
- **Security = the signature**, which is a hash of `header + payload + SECRET`.
- Attacker edits payload to `userId: 1` → signature no longer matches → `verify` throws. They can't re-sign without the `.env` secret.
- **Takeaway:** anyone can *read* a JWT; nobody can *forge* one without the secret.

---

## 4. The protect middleware

```ts
// middleware/protect.ts
import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/token.js";
import type { Request, Response, NextFunction } from "express";

export const protect = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;                 // "Bearer <token>"
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Not authenticated"));
  }
  const token = header.split(" ")[1];
  try {
    req.userId = verifyToken(token);                        // attach identity
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));    // verify threw
  }
};
```

- Runs **before** protected controllers: `router.get("/", protect, listExpenses)`.
- `req.userId` is set from the **verified token**, so controllers can trust it. A user can't fake their id via the body.
- Needs a **TS type augmentation** so `req.userId` is legal:
  ```ts
  // types/express.d.ts
  declare global { namespace Express { interface Request { userId?: number } } }
  export {};
  ```

---

## 5. Scoping data to the logged-in user

Before auth: `userId` came from the request body (spoofable, wrong). After auth:

```ts
// create — id comes from the token, not the client
await prisma.expense.create({ data: { ...body, userId: req.userId } });

// read/update/delete — only touch YOUR rows
await prisma.expense.findMany({ where: { userId: req.userId } });
```

This is the whole point of auth on a CRUD API: **users only see and modify their own data.**

---

## Gotchas learned

- **Never trust `userId` from the body** once auth exists — always from `req.userId` (the verified token).
- **`jwt.verify` throws** — always wrap in try/catch (or asyncHandler) and turn it into a `401`.
- **Secret in `.env` only** — leaking it = anyone can forge tokens. Never commit it.
- **Password never in the JWT payload / never in API responses** — strip it: return `{ id, name, email }`, not the whole user row.
- **`exactOptionalPropertyTypes`** makes `expiresIn` type-picky → cast with `NonNullable<SignOptions["expiresIn"]>`.
- **401 vs 403:** `401` = not authenticated (no/bad token); `403` = authenticated but not allowed (wrong role/owner).

---

## Interview quick-hits

- **Why JWT over sessions?** Stateless — server stores nothing; token carries + proves identity. Scales across servers. Trade-off: hard to revoke before expiry (hence short-ish expiry).
- **Is a JWT encrypted?** No — payload is readable. It's *signed*, not secret. Security = signature, not hiding.
- **Why bcrypt over a plain hash (SHA)?** Salted (stops rainbow tables) + deliberately slow (stops brute force). SHA is fast = bad for passwords.
- **Where does `userId` come from in a protected route?** The verified token (`req.userId`), never the request body.
- **401 vs 403?** Not-authenticated vs authenticated-but-forbidden.
- **What stops token forgery?** No secret → can't regenerate a valid signature → `verify` throws.
