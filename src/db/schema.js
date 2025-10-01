import { pgTable, timestamp, uuid, text, jsonb, array, numeric , integer} from "drizzle-orm/pg-core";

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

export const booksTable = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  bookId: uuid("book_id").notNull(),
  genres: jsonb("genres"),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  link: text("link").notNull(),
  rating: numeric("rating").notNull(),
  reviews: text("reviews").notNull(),
  tags: jsonb("tags"),
  publishedAt: timestamp("published_at").notNull(),
  pages: integer("pages").notNull(),
  language: text("language").notNull(),
  publisher: text("publisher").notNull(),
  category: text("category").notNull(),
  subCategory: text("sub_category").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});