-- Create profiles table
CREATE TABLE IF NOT EXISTS "profiles" (
  "clerk_id" text PRIMARY KEY,
  "username" text UNIQUE,
  "avatar_url" text,
  "genres" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Change favourites.user_id to text to store Clerk userId
ALTER TABLE "favourites"
  ALTER COLUMN "user_id" TYPE text USING "user_id"::text;

