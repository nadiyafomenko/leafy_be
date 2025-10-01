CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid,
	"genres" jsonb,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"description" text,
	"image_url" text,
	"link" text,
	"rating" numeric,
	"reviews" text,
	"tags" jsonb,
	"published_at" timestamp,
	"pages" integer,
	"language" text,
	"publisher" text,
	"category" text,
	"sub_category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favourites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"book_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"clerk_id" text PRIMARY KEY NOT NULL,
	"username" text,
	"avatar_url" text,
	"genres" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
