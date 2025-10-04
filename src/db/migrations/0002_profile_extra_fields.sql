DO $$ BEGIN
  ALTER TABLE "profiles" ADD COLUMN "date_of_birth" date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "profiles" ADD COLUMN "language" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "profiles" ADD COLUMN "region" text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

