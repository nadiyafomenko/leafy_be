import { and, eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { booksTable } from "../db/schema.js";

export async function getBooks(params) {
  const { userId } = params;
    const rows = await db.select().from(booksTable).where(eq(booksTable.userId, userId));
  return rows[0];
}

export async function getBook(params) {
  const { userId, bookId } = params;
  return await db.select().from(booksTable).where(and(eq(booksTable.id, bookId), eq(booksTable.userId, userId)));
}


