CREATE TABLE "profiles" (
	"clerk_id" text PRIMARY KEY NOT NULL,
	"username" text,
	"avatar_url" text,
	"genres" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "favourites" ALTER COLUMN "user_id" SET DATA TYPE text;