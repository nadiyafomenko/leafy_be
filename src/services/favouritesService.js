import { and, eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { favouritesTable } from "../db/schema.js";

export async function insertFavourite(params) {
  const { userId, bookId } = params;
  const rows = await db.insert(favouritesTable).values({ userId, bookId }).returning();
  return rows[0];
}

export async function removeFavouriteByIdForUser(params) {
  const { favouriteId, userId } = params;
  return await db
    .delete(favouritesTable)
    .where(and(eq(favouritesTable.id, favouriteId), eq(favouritesTable.userId, userId)));
}


