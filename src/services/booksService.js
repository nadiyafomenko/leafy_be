import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { booksTable } from "../db/schema.js";

export async function getBooks() {
  return await db.select().from(booksTable);
}

export async function getBook(params) {
  const { bookId } = params;
  return await db.select().from(booksTable).where(eq(booksTable.id, bookId));
}


