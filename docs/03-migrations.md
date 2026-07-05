# Migrations (Prisma)

Versioned, recorded changes to your database structure. "Git for your database." Concise by design.

---

## 1. What a migration is

- A **recorded SQL change** to the DB *structure* (tables/columns/indexes/constraints).
- Stored as a `.sql` file in `prisma/migrations/<timestamp>_<name>/`.
- **It's just SQL.** Prisma's value = *generating*, *ordering*, *recording*, and *replaying* it — not magic.

```
schema.prisma → migrate dev → SQL file → applied to DB → recorded in _prisma_migrations
"what I want"                "how to get there"  "done"     "already applied"
```

---

## 2. The two directions

| Command | Direction | Meaning |
|---|---|---|
| `prisma db pull` | **DB → schema** | Introspect an existing DB, generate schema from it. |
| `prisma migrate` | **schema → DB** | Change the DB to match the schema, and record it. |

---

## 3. The three migrate commands

| Command | Where | What it does |
|---|---|---|
| `migrate dev` | **local** | Creates a new migration **and applies** it. Daily driver. Can reset/wipe. **Never on prod.** |
| `migrate deploy` | **beta/prod** | **Only applies** existing migrations. Never creates, never wipes. Safe. |
| `migrate resolve` | **special** | Records a migration as applied/rolled-back **without running SQL**. For baselining / fixing stuck migrations. |

Also: `migrate status` → shows applied vs pending; your **drift detector**.

**Rule of thumb:**
- `migrate dev` = "I changed the schema, make it real" (95% of the time)
- `migrate deploy` = "apply what's already created, safely" (servers)
- `migrate resolve` = "just update the ledger, don't touch the DB" (rare)

---

## 4. The `_prisma_migrations` table

- A special table Prisma creates **inside the database** — its ledger/checklist.
- Records which migrations have already run, so each runs **exactly once**.
- Each environment (laptop, beta, prod) has its **own** copy, tracking what *it* has applied.

**How `migrate deploy` works:**
1. Reads `prisma/migrations/` folder → what *should* exist.
2. Reads `_prisma_migrations` table → what's *already applied here*.
3. Runs only the difference (unapplied ones), in timestamp order.

---

## 5. Environments (dev / beta / prod)

- **Same migration files** flow through git: dev → beta → prod.
- Only the **`DATABASE_URL`** differs per environment.
- Workflow:
  1. Local: `migrate dev --name add_notes` → creates + applies file, commit it.
  2. Beta deploy: `migrate deploy` → applies file to beta DB.
  3. Prod deploy: `migrate deploy` → applies same file to prod DB.
- Result: every environment ends up **identical**.

---

## 6. How Prisma orders SQL

Within one migration, Prisma sorts by **dependency** — a thing must exist before something points to it:

1. `CREATE TABLE` (boxes)
2. `CREATE INDEX`
3. `ALTER TABLE ... ADD FOREIGN KEY` (arrows) — **last**

> Build the boxes first, then draw the arrows.

Across migrations: ordered by **timestamp**, oldest first.

---

## 7. Data safety

**Dropping a column = data gone forever** (irreversible without a backup).

**Rename trap:** renaming a field, Prisma may generate `DROP COLUMN old; ADD COLUMN new;` → data lost. Hand-edit the migration to `ALTER TABLE ... RENAME COLUMN` to preserve data. **Always read a generated migration before applying to real data.**

**Adding a column — what existing rows get:**

| You add | Existing rows get | Safe with data? |
|---|---|---|
| `notes String?` (nullable) | `NULL` | ✅ always |
| `status String @default("x")` | the default | ✅ always |
| `notes String` (required, no default) | *nothing to give them* | ❌ migration fails if rows exist |

**Required column on a populated table → 3-step (zero-downtime):** add nullable → backfill with `UPDATE` → alter to `NOT NULL`.

---

## 8. Drift & reconciliation

- **Drift** = schema, migration history, and actual DB disagree.
- Causes: hand-editing the DB (pgAdmin/psql) without a migration; skipping migrations.
- **Detect:** `migrate status`.
- **Reconcile** = make them agree again (add/remove columns, `db pull`, or a new migration).

**Golden rule:** all structure changes go through **one** system — schema + migration. Don't mix manual SQL and migrations, or they fight.

---

## 9. DDL vs DML (where changes belong)

| | SQL | Where |
|---|---|---|
| **DDL** (structure) | `CREATE/ALTER/DROP` | schema + migration |
| **DML** (data) | `INSERT/SELECT/UPDATE/DELETE` | app code (`prisma.expense.create()`) |

Running app code should **never** change structure. pgAdmin structure edits = drift.

---

## 10. Baselining (adopt migrations on an existing DB)

When tables already exist but there's no migration history:

```bash
mkdir -p prisma/migrations/0_init
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
npx prisma migrate resolve --applied 0_init      # marks as done WITHOUT running SQL
npx prisma migrate status                        # → "up to date"
```

⚠️ Baselining assumes **schema already matches the DB**. If they've drifted (schema has columns the DB lacks), reconcile first, or the baseline records a lie.

> Prisma 7 note: use `--to-schema` (the old `--to-schema-datamodel` was removed).

---

## 11. Backup first (before anything destructive)

```bash
pg_dump -U postgres -h localhost expense_tracker > backup.sql   # backup
psql     -U postgres -h localhost expense_tracker < backup.sql   # restore
# compressed / portable:
pg_dump -Fc ... > backup.dump   &&   pg_restore -d expense_tracker backup.dump
```

---

## Interview quick-hits

- **Migration = recorded structural SQL** ("git for the DB").
- **`migrate dev` vs `deploy` vs `resolve`:** create+apply (local) / apply-only (prod) / update-ledger-only (baseline).
- **`_prisma_migrations`:** in-DB ledger of applied migrations, one per environment, ensures each runs once.
- **Drift:** schema/history/DB disagree; caused by manual edits; detect with `migrate status`.
- **Ordering:** tables → indexes → foreign keys (dependency order); migrations by timestamp.
- **Drop column = permanent data loss;** rename can silently drop+add.
- **db pull = DB→schema; migrate = schema→DB.**
