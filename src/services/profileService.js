import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { profilesTable } from "../db/schema.js";

export async function getOrCreateProfileByClerkId(clerkId) {
  const existing = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, clerkId));
  if(existing.length > 0) return existing[0];
  const inserted = await db.insert(profilesTable).values({ clerkId }).returning();
  return inserted[0];
}

export async function upsertProfile(clerkId, updateData) {
  const rows = await db
    .insert(profilesTable)
    .values({ clerkId, ...updateData })
    .onConflictDoUpdate({
      target: profilesTable.clerkId,
      set: updateData,
    })
    .returning();
  return rows[0];
}

export async function createProfile(clerkId) {
  const inserted = await db.insert(profilesTable).values({ clerkId }).returning();
  return inserted[0];
}


