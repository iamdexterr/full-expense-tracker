# PostgreSQL / SQL Basics

Quick-reference notes for revision and interviews. Concise by design.

---

## 1. Mental model

- **Server → Database → Table → Row/Column.** One Postgres server holds many databases; a database holds many tables.
- **DDL** (Data Definition Language) = changes *structure*: `CREATE`, `ALTER`, `DROP`.
- **DML** (Data Manipulation Language) = changes *data*: `INSERT`, `SELECT`, `UPDATE`, `DELETE`.

---

## 2. Databases & tables (DDL)

```sql
CREATE DATABASE expense_tracker;
DROP DATABASE expense_tracker;

CREATE TABLE users (
  id         SERIAL PRIMARY KEY,          -- auto-incrementing integer
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE users;                          -- deletes table + all its data
```

**Alter structure:**
```sql
ALTER TABLE users ADD COLUMN age INT;
ALTER TABLE users DROP COLUMN age;         -- data in that column is gone forever
ALTER TABLE users RENAME COLUMN name TO full_name;   -- preserves data
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

---

## 3. Common data types

| Type | Use |
|---|---|
| `SERIAL` / `BIGSERIAL` | auto-increment IDs |
| `INT` / `BIGINT` | whole numbers |
| `DECIMAL(10,2)` / `NUMERIC` | **money** (never use `FLOAT`) |
| `VARCHAR(n)` / `TEXT` | strings |
| `BOOLEAN` | true/false |
| `TIMESTAMP` / `DATE` | date & time |
| `UUID` | unique IDs |

---

## 4. Constraints

| Constraint | Meaning |
|---|---|
| `PRIMARY KEY` | unique + not null; row identity |
| `UNIQUE` | no duplicate values |
| `NOT NULL` | value required |
| `DEFAULT x` | fallback value if none given |
| `FOREIGN KEY` | links to another table's PK |
| `CHECK (amount > 0)` | custom validation rule |

---

## 5. CRUD (DML)

**Insert:**
```sql
INSERT INTO users (name, email) VALUES ('Dinesh', 'd@x.com');
INSERT INTO users (name, email) VALUES ('A','a@x.com'), ('B','b@x.com');  -- multiple rows
```

**Read:**
```sql
SELECT * FROM users;
SELECT name, email FROM users;
SELECT * FROM users WHERE id = 1;
```

**Update:**
```sql
UPDATE users SET name = 'New' WHERE id = 1;   -- ⚠️ no WHERE = updates EVERY row
```

**Delete:**
```sql
DELETE FROM users WHERE id = 1;               -- ⚠️ no WHERE = deletes EVERY row
```

---

## 6. Filtering — WHERE

```sql
SELECT * FROM expenses WHERE amount > 100;
SELECT * FROM expenses WHERE amount BETWEEN 50 AND 200;
SELECT * FROM expenses WHERE category_id IN (1, 2, 3);
SELECT * FROM users   WHERE email LIKE '%@gmail.com';   -- pattern match
SELECT * FROM users   WHERE name ILIKE 'din%';          -- case-insensitive
SELECT * FROM expenses WHERE notes IS NULL;
SELECT * FROM expenses WHERE amount > 100 AND category_id = 2;
SELECT * FROM expenses WHERE amount > 100 OR title = 'Rent';
```

---

## 7. Sorting, limiting, pagination

```sql
SELECT * FROM expenses ORDER BY amount DESC;
SELECT * FROM expenses ORDER BY date DESC, amount ASC;
SELECT * FROM expenses LIMIT 10;                 -- first 10
SELECT * FROM expenses LIMIT 10 OFFSET 20;       -- page 3 (skip 20, take 10)
```

---

## 8. Aggregates & GROUP BY

```sql
SELECT COUNT(*)  FROM expenses;
SELECT SUM(amount) FROM expenses;
SELECT AVG(amount), MIN(amount), MAX(amount) FROM expenses;

-- total spent per category
SELECT category_id, SUM(amount) AS total
FROM expenses
GROUP BY category_id;

-- categories where total spend > 1000  (HAVING filters groups; WHERE filters rows)
SELECT category_id, SUM(amount) AS total
FROM expenses
GROUP BY category_id
HAVING SUM(amount) > 1000;
```

**Interview note:** `WHERE` filters *rows before* grouping; `HAVING` filters *groups after* aggregation.

---

## 9. JOINs

Combine rows from multiple tables via a relationship.

```sql
-- each expense with its user's name (only matching rows)
SELECT e.title, e.amount, u.name
FROM expenses e
INNER JOIN users u ON e.user_id = u.id;
```

| JOIN | Returns |
|---|---|
| `INNER JOIN` | only rows matching in **both** tables |
| `LEFT JOIN` | all rows from **left** + matches (NULLs if none) |
| `RIGHT JOIN` | all rows from **right** + matches |
| `FULL JOIN` | all rows from both, matched where possible |

```sql
-- users and their expense count (LEFT = include users with 0 expenses)
SELECT u.name, COUNT(e.id) AS expense_count
FROM users u
LEFT JOIN expenses e ON u.id = e.user_id
GROUP BY u.id, u.name;
```

---

## 10. Indexes

Speed up lookups on columns you filter/sort by often.

```sql
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

**Interview note:** indexes make reads faster but writes slightly slower + use disk. `PRIMARY KEY` and `UNIQUE` create indexes automatically.

---

## 11. Transactions

All-or-nothing: either every statement succeeds, or none do.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;      -- save all
-- ROLLBACK;  -- undo all if something failed
```

**ACID** (interview keyword): **A**tomicity, **C**onsistency, **I**solation, **D**urability.

---

## 12. Handy psql commands

```
\l          list databases
\c dbname   connect to a database
\dt         list tables
\d table    describe a table (columns, types, constraints)
\du         list users/roles
\q          quit
```

---

## 13. Backup & restore

```bash
pg_dump -U postgres -h localhost expense_tracker > backup.sql   # backup
psql     -U postgres -h localhost expense_tracker < backup.sql   # restore
```

---

## Interview quick-hits

- **PK vs UNIQUE:** PK is one per table, not null, is the row identity; UNIQUE can be many, allows one NULL.
- **WHERE vs HAVING:** WHERE before grouping (rows), HAVING after (groups).
- **DELETE vs TRUNCATE vs DROP:** DELETE removes rows (can filter, slow); TRUNCATE empties whole table fast; DROP removes the table itself.
- **`DECIMAL` not `FLOAT` for money** — float has rounding errors.
- **Always use `WHERE` with UPDATE/DELETE** or you hit every row.
- **INNER vs LEFT JOIN:** INNER = only matches; LEFT = keep all left rows even without a match.
