DO $$ BEGIN
  ALTER TABLE "profiles" ADD COLUMN "favorite_authors" jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

