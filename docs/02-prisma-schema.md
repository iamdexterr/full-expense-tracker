# Prisma Schema Basics

How you describe your database in code. Concise by design.

---

## 1. Schema vs Model

- **Schema** = the whole `schema.prisma` file (all tables + config).
- **Model** = ONE table inside it (`model User {}` → `users` table).
- Schema = the book, Model = a chapter.

---

## 2. Anatomy of a schema

```prisma
generator client {              // tells Prisma to generate the JS/TS client
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {                 // which database + connection
  provider = "postgresql"
}

model User {                    // one table
  id    Int    @id @default(autoincrement())
  email String @unique
}
```

---

## 3. Naming: code vs database

| World | Style | Example |
|---|---|---|
| Code (Prisma/JS) | `camelCase` / PascalCase | `userId`, `User` |
| Database (Postgres) | `snake_case` | `user_id`, `users` |

**Bridge attributes:**
- `@map("user_id")` → renames a **column** (field-level).
- `@@map("users")` → renames a **table** (model-level).

```prisma
model User {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now()) @map("created_at")  // code: createdAt, db: created_at
  @@map("users")                                          // code: User,     db: users
}
```

**Rule:** camelCase in code, snake_case in DB. `@map`/`@@map` translate. Single-word names (`title`, `email`) need no map.

---

## 4. `@` vs `@@`

- `@`  = **field-level** (sits on a field line): `@id`, `@unique`, `@default`, `@map`, `@relation`, `@db.*`
- `@@` = **model-level** (own line in the block): `@@map`, `@@unique([a,b])`, `@@index([a])`, `@@id([a,b])`

More `@` = bigger scope. `@unique` = one column unique; `@@unique([a,b])` = the *combination* unique.

---

## 5. Common field attributes

| Attribute | Meaning |
|---|---|
| `@id` | primary key |
| `@default(autoincrement())` | auto-increment |
| `@default(now())` | current timestamp |
| `@unique` | unique constraint |
| `@map("col")` | rename column |
| `@relation(...)` | define a relationship |
| `@db.VarChar(100)` | exact Postgres type |
| `?` (e.g. `String?`) | optional / nullable |

---

## 6. Types

| Prisma | Postgres | Note |
|---|---|---|
| `Int` | INTEGER | |
| `String` | TEXT / VARCHAR | add `@db.VarChar(n)` |
| `Decimal @db.Decimal(10,2)` | NUMERIC | **money** |
| `DateTime` | TIMESTAMP | |
| `Boolean` | BOOLEAN | |
| `String?` | nullable column | the `?` = optional |

---

## 7. Relations

```prisma
model User {
  id       Int       @id @default(autoincrement())
  expenses Expense[]                        // one user → many expenses
}

model Expense {
  id     Int  @id @default(autoincrement())
  userId Int  @map("user_id")
  user   User @relation(fields: [userId], references: [id])  // many expenses → one user
}
```

- The side with `@relation(fields:...)` holds the **foreign key**.
- The `[]` side is the "many" side (a virtual list, not a real column).
- In generated SQL, a relation becomes a `FOREIGN KEY` constraint.

---

## 8. Useful CLI

```bash
npx prisma format     # auto-tidy indentation + attribute order
npx prisma validate   # check schema is valid
npx prisma generate   # regenerate the client after schema changes
npx prisma db pull    # DB → schema (introspect existing DB)
npx prisma studio     # visual DB browser in the browser
```

---

## 9. Prisma Client — setup

The generated client is how your code talks to the DB. Create **one** instance and reuse it.

```ts
import { PrismaClient } from "./generated/prisma";
export const prisma = new PrismaClient();
```

- Model name → lowercase method: `model User` → `prisma.user`.
- All queries are **async** (return Promises → use `await`).
- Field names are **camelCase** (the code side), never snake_case.

---

## 10. CRUD queries

**Create:**
```ts
await prisma.user.create({ data: { name: "Dinesh", email: "d@x.com" } });
await prisma.expense.create({
  data: { title: "Coffee", amount: 4.5, userId: 1, categoryId: 2 },
});
```

**Read:**
```ts
await prisma.expense.findMany();                          // all
await prisma.expense.findUnique({ where: { id: 1 } });    // one by unique field
await prisma.user.findFirst({ where: { name: "Dinesh" } }); // first match
```

**Update:**
```ts
await prisma.expense.update({
  where: { id: 1 },
  data: { amount: 9.99 },
});
```

**Delete:**
```ts
await prisma.expense.delete({ where: { id: 1 } });
await prisma.expense.deleteMany({ where: { userId: 1 } });  // bulk
```

**Upsert** (update if exists, else create):
```ts
await prisma.category.upsert({
  where: { name: "Food" },
  update: {},
  create: { name: "Food" },
});
```

---

## 11. Filtering, sorting, pagination

```ts
await prisma.expense.findMany({
  where: {
    userId: 1,
    amount: { gt: 100 },                 // gt, gte, lt, lte, not
    title: { contains: "cab", mode: "insensitive" },
    categoryId: { in: [1, 2, 3] },
    date: { gte: new Date("2026-01-01") },
  },
  orderBy: { date: "desc" },
  skip: 20,                              // pagination: skip
  take: 10,                              // pagination: limit
  select: { id: true, title: true, amount: true },  // pick fields
});
```

**Operators cheat:** `gt/gte/lt/lte` (compare), `not`, `in/notIn`, `contains/startsWith/endsWith`, `mode: "insensitive"`.

**AND / OR / NOT:**
```ts
where: {
  OR: [{ title: "Rent" }, { amount: { gt: 1000 } }],
  AND: [{ userId: 1 }, { categoryId: 2 }],
}
```

---

## 12. Relations in queries

**`include`** — fetch related records:
```ts
await prisma.expense.findMany({ include: { user: true, category: true } });
await prisma.user.findUnique({
  where: { id: 1 },
  include: { expenses: true },           // user + all their expenses
});
```

**Nested create** — create a user *and* their expense at once:
```ts
await prisma.user.create({
  data: {
    name: "Dinesh", email: "d@x.com",
    expenses: { create: [{ title: "Coffee", amount: 4.5, categoryId: 1 }] },
  },
});
```

**`select` vs `include`:** `select` = pick which fields to return; `include` = add related records. Don't use both at the same level.

---

## 13. Aggregates & grouping

```ts
await prisma.expense.aggregate({
  where: { userId: 1 },
  _sum: { amount: true },
  _avg: { amount: true },
  _count: true,
});

// total per category (SQL GROUP BY equivalent)
await prisma.expense.groupBy({
  by: ["categoryId"],
  _sum: { amount: true },
});

await prisma.expense.count({ where: { userId: 1 } });
```

---

## 14. Transactions & raw SQL

```ts
// all-or-nothing: both succeed or both roll back
await prisma.$transaction([
  prisma.expense.create({ data: {/*...*/} }),
  prisma.user.update({ where: { id: 1 }, data: {/*...*/} }),
]);

// escape hatch when you need real SQL
await prisma.$queryRaw`SELECT * FROM expenses WHERE amount > ${100}`;
```

---

## Interview quick-hits

- **Schema vs model:** file vs one table.
- **`@map` vs `@@map`:** column rename vs table rename.
- **`@` vs `@@`:** field-level vs model-level.
- **Where camelCase / snake_case live:** code / database; mapped by `@map`.
- **Relation FK side:** the one with `@relation(fields:...)`.
- **`db pull` vs migrate:** introspect (DB→schema) vs apply (schema→DB).
- **`select` vs `include`:** pick fields vs add related records.
- **`findUnique` vs `findFirst`:** by unique field vs first row matching any filter.
- **`create` vs `upsert`:** always insert vs insert-or-update.
- **Pagination:** `skip` + `take` (= SQL `OFFSET` + `LIMIT`).
- **`aggregate` / `groupBy`:** ORM equivalent of SQL `SUM/AVG/COUNT` + `GROUP BY`.
- **One `PrismaClient` instance** — reuse it, don't create per request.
