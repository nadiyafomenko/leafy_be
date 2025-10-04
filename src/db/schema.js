import { pgTable, timestamp, uuid, text, jsonb, numeric , integer, date } from "drizzle-orm/pg-core";

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
  dateOfBirth: date("date_of_birth"),
  language: text("language"),
  region: text("region"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const booksTable = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookId: uuid("book_id"),
  genres: jsonb("genres"),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  link: text("link"),
  rating: numeric("rating"),
  reviews: text("reviews"),
  tags: jsonb("tags"),
  publishedAt: timestamp("published_at"),
  pages: integer("pages"),
  language: text("language"),
  publisher: text("publisher"),
  category: text("category"),
  subCategory: text("sub_category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const genresCatalogTable = pgTable("genres_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});