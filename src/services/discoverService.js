import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "../config/db.js";
import { booksTable, favouritesTable, profilesTable } from "../db/schema.js";
import { rerankWithLLM } from "./llmService.js";

function toCompact(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    genres: Array.isArray(book.genres) ? book.genres : [],
    desc: book.description?.slice(0, 280) || "",
    popularity: Number(book.rating) || 0,
    recency: book.publishedAt,
    lang: book.language || null,
    imageUrl: book.imageUrl || null,
  };
}

function encodeCursor(item) {
  if(!item) return null;
  const score = typeof item.score === "number" ? item.score.toFixed(6) : "0.000000";
  return Buffer.from(`${score}:${item.id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor) {
  if(!cursor) return null;
  try {
    const [score, id] = Buffer.from(cursor, "base64url").toString("utf8").split(":");
    return { score: Number(score), id };
  } catch {
    return null;
  }
}

export async function getDiscoverFeed({ clerkId, limit = 20, cursor }) {
  // 1) Load profile
  const profileRows = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, clerkId));
  const profile = profileRows?.[0] || {};

  // 2) Exclude favourites (as an example of seen items)
  const favs = await db.select().from(favouritesTable).where(eq(favouritesTable.userId, clerkId));
  const excludeIds = new Set(favs.map(f => f.bookId));

  // 3) Candidate generation (simple filters + recency/popularity). For MVP we do SQL only
  // Optional filters
  const predicates = [isNotNull(booksTable.id)];
  if(profile.language) predicates.push(eq(booksTable.language, profile.language));
  // region filter could be applied when availability column exists

  const topK = Math.max(limit * 5, 100);
  const rows = await db
    .select()
    .from(booksTable)
    .where(and(...predicates))
    .orderBy(desc(booksTable.rating), desc(booksTable.publishedAt))
    .limit(topK);

  const rawCandidates = rows.filter(r => !excludeIds.has(r.id)).map(toCompact);

  // 4) LLM rerank limited set
  const candidateSlice = rawCandidates.slice(0, 150);
  const reranked = await rerankWithLLM(profile, candidateSlice);

  const scoreMap = new Map(reranked.map(r => [String(r.id), Number(r.score) || 0]));
  const merged = candidateSlice
    .map(c => ({ ...c, score: scoreMap.get(String(c.id)) ?? 0 }))
    .sort((a, b) => (b.score - a.score) || (b.popularity - a.popularity) || String(b.id).localeCompare(String(a.id)));

  // 5) Cursor pagination over stable sort
  const decoded = decodeCursor(cursor);
  let startIndex = 0;
  if(decoded) {
    startIndex = merged.findIndex(i => i.id === decoded.id);
    if(startIndex >= 0) startIndex += 1;
  }
  const window = merged.slice(startIndex, startIndex + limit);
  const nextCursor = encodeCursor(window[window.length - 1]);

  return { items: window, nextCursor };
}


