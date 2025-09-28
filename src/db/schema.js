import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const favouritesTable = pgTable("favourites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  bookId: uuid("book_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});