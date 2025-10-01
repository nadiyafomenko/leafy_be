import { pgTable, timestamp, uuid, text, jsonb } from "drizzle-orm/pg-core";

export const favouritesTable = pgTable("favourites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  bookId: uuid("book_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profilesTable = pgTable("profiles", {
  clerkId: text("clerk_id").primaryKey(),
  username: text("username").unique(),
  avatarUrl: text("avatar_url"),
  genres: jsonb("genres"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});