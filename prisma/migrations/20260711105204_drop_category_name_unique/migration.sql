-- Drop the old global-unique on name. In some databases it exists as a CONSTRAINT
-- (index-backed), in a fresh replay it's a plain INDEX. Handle both so this applies
-- cleanly to both the real database and Prisma's shadow database.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_name_key'
      AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE "categories" DROP CONSTRAINT "categories_name_key";
  ELSE
    DROP INDEX IF EXISTS "categories_name_key";
  END IF;
END $$;
