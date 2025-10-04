import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { booksTable } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";

const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";
const DEFAULT_PAGE_SIZE = 100;
const REQUEST_DELAY_MS = 400;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildCoversUrl(coverId) {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
}

function toPublishedAt(year) {
  if (!year) return null;
  try {
    return new Date(Date.UTC(Number(year), 0, 1));
  } catch (_) {
    return null;
  }
}

function normalizeAuthor(authorNames) {
  if (!authorNames || !Array.isArray(authorNames) || authorNames.length === 0) {
    return "Unknown";
  }
  return authorNames.join(", ");
}

function chooseLanguage(languageCodes) {
  if (!languageCodes || languageCodes.length === 0) return null;
  if (languageCodes.includes("ukr")) return "ukr";
  return languageCodes[0];
}

function buildLinkFromKey(key) {
  if (!key) return null;
  return `${OPEN_LIBRARY_BASE_URL}${key}`;
}

function isLikelyUkrainianTitle(title) {
  if (!title || typeof title !== "string") return false;
  const normalized = title.trim();
  if (normalized.length === 0) return false;
  // Prefer titles that include Ukrainian-specific characters
  const hasUkrainianSpecificChars = /[ґҐєЄіІїЇ]/.test(normalized);
  if (hasUkrainianSpecificChars) return true;
  // Fallback: allow Cyrillic if language is already filtered to ukr
  const hasCyrillic = /[\u0400-\u04FF]/.test(normalized);
  return hasCyrillic;
}

function docHasCover(doc) {
  return Boolean(doc && doc.cover_i);
}

function docIsUkrainian(doc) {
  return Array.isArray(doc?.language) && doc.language.includes("ukr");
}

function filterDocsForUkrainianCoverAndTitle(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.filter((doc) => docIsUkrainian(doc) && docHasCover(doc) && isLikelyUkrainianTitle(doc.title));
}

export async function backfillGenresCatalog(db, tables) {
  const { booksTable, genresCatalogTable } = tables;

  // Read all distinct genre strings from books.genres (jsonb array)
  const rows = await db.select({ genres: booksTable.genres }).from(booksTable);
  const unique = new Set();
  for (const row of rows) {
    const g = row.genres;
    if (Array.isArray(g)) {
      for (const name of g) {
        if (typeof name === "string" && name.trim().length > 0) {
          unique.add(name.trim());
        }
      }
    }
  }
  if (unique.size === 0) return { inserted: 0 };

  const values = Array.from(unique).map((name) => ({ name }));
  await db.insert(genresCatalogTable).values(values);
  return { inserted: values.length };
}

function buildSearchUrl({ strategy, page, limit }) {
  const url = new URL(`${OPEN_LIBRARY_BASE_URL}/search.json`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (strategy === "param_language_ukr") {
    url.searchParams.set("language", "ukr");
  } else if (strategy === "q_language_ukr") {
    url.searchParams.set("q", "language:ukr");
  } else if (strategy === "q_languages_ukr") {
    url.searchParams.set("q", "languages:ukr");
  }
  return url;
}

async function fetchUkrainianWorksPage(strategy, page, limit) {
  const url = buildSearchUrl({ strategy, page, limit });
  const headers = {
    "User-Agent": `leafy-openlibrary-seed/1.0 (${env.API_URL || "no-api-url"})`,
    "Accept": "application/json",
  };
  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`OpenLibrary request failed: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

function mapDocToBookRow(doc) {
  const link = buildLinkFromKey(doc.key);
  const imageUrl = buildCoversUrl(doc.cover_i);
  const author = normalizeAuthor(doc.author_name);
  const publishedAt = toPublishedAt(doc.first_publish_year);
  const language = chooseLanguage(doc.language);
  const publisher = Array.isArray(doc.publisher) && doc.publisher.length > 0 ? doc.publisher[0] : null;
  const pages = doc.number_of_pages_median || null;
  const subjects = (() => {
    if (Array.isArray(doc.subject) && doc.subject.length > 0) return doc.subject;
    if (Array.isArray(doc.subject_facet) && doc.subject_facet.length > 0) return doc.subject_facet;
    if (Array.isArray(doc.subject_key) && doc.subject_key.length > 0) return doc.subject_key;
    return null;
  })();

  return {
    title: doc.title || "Untitled",
    author,
    description: null,
    imageUrl,
    link,
    rating: null,
    reviews: null,
    tags: subjects,
    genres: subjects,
    publishedAt,
    pages,
    language,
    publisher,
    category: null,
    subCategory: null,
  };
}

async function fetchWorkSubjects(workKey) {
  if (!workKey) return null;
  const url = new URL(`${OPEN_LIBRARY_BASE_URL}${workKey}.json`);
  const headers = {
    "User-Agent": `leafy-openlibrary-seed/1.0 (${env.API_URL || "no-api-url"})`,
    "Accept": "application/json",
  };
  try {
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) return null;
    const json = await res.json();
    const subjects = Array.isArray(json.subjects) ? json.subjects : null;
    return subjects && subjects.length > 0 ? subjects : null;
  } catch (_) {
    return null;
  }
}

async function enrichRowsWithWorkSubjects(rows, docs) {
  // Build link -> workKey map from docs
  const linkToWorkKey = new Map();
  for (const d of docs) {
    const l = buildLinkFromKey(d.key);
    if (l) linkToWorkKey.set(l, d.key);
  }
  for (const row of rows) {
    if (row.genres && Array.isArray(row.genres) && row.genres.length > 0) continue;
    const workKey = linkToWorkKey.get(row.link);
    const subjects = await fetchWorkSubjects(workKey);
    if (subjects && subjects.length > 0) {
      row.genres = subjects;
      row.tags = subjects;
    }
    await delay(200);
  }
}

async function upsertBooks(docs) {
  if (!docs || docs.length === 0) return { inserted: 0, skipped: 0 };

  const candidateRows = docs.map(mapDocToBookRow).filter((r) => r.link);
  // Enrich missing genres via works/{id}.json subjects
  const needsGenreEnrichment = candidateRows.some(
    (r) => !r.genres || (Array.isArray(r.genres) && r.genres.length === 0)
  );
  if (needsGenreEnrichment) {
    await enrichRowsWithWorkSubjects(candidateRows, docs);
  }
  if (candidateRows.length === 0) return { inserted: 0, skipped: 0 };

  const links = candidateRows.map((r) => r.link);
  const existing = await db
    .select({ link: booksTable.link, genres: booksTable.genres })
    .from(booksTable)
    .where(inArray(booksTable.link, links));
  const existingMap = new Map(existing.map((e) => [e.link, e]));
  const existingLinks = new Set(existing.map((e) => e.link));

  const rowsToInsert = candidateRows.filter((r) => !existingLinks.has(r.link));
  if (rowsToInsert.length === 0) return { inserted: 0, skipped: candidateRows.length };

  await db.insert(booksTable).values(rowsToInsert);
  // Optionally update existing rows missing genres if we have them
  if (String(process.env.SEED_UPDATE_EXISTING || "false").toLowerCase() === "true") {
    for (const r of candidateRows) {
      const ex = existingMap.get(r.link);
      const exGenres = ex?.genres;
      if ((!exGenres || (Array.isArray(exGenres) && exGenres.length === 0)) && r.genres && r.genres.length > 0) {
        await db.update(booksTable).set({ genres: r.genres, tags: r.tags }).where(eq(booksTable.link, r.link));
        await delay(50);
      }
    }
  }
  return { inserted: rowsToInsert.length, skipped: candidateRows.length - rowsToInsert.length };
}

async function main() {
  const pageSize = Number(process.env.SEED_PAGE_SIZE || DEFAULT_PAGE_SIZE);
  let page = 1;
  let totalInserted = 0;
  let totalSkipped = 0;

  // Fixed strategy per request
  const chosenStrategy = "q_language_ukr";
  console.log(`Using OpenLibrary search strategy: ${chosenStrategy}`);

  // Continue until no docs returned
  for (;;) {
    try {
      const data = await fetchUkrainianWorksPage(chosenStrategy, page, pageSize);
      const docs = Array.isArray(data.docs) ? data.docs : [];
      const filteredDocs = filterDocsForUkrainianCoverAndTitle(docs);

      if (docs.length === 0) {
        break;
      }

      const { inserted, skipped } = await upsertBooks(filteredDocs);
      totalInserted += inserted;
      totalSkipped += skipped;

      console.log(
        `Processed page ${page} (docs=${docs.length}, filtered=${filteredDocs.length}) -> inserted=${inserted}, skipped=${skipped} (totalInserted=${totalInserted}, totalSkipped=${totalSkipped})`
      );

      page += 1;
      await delay(REQUEST_DELAY_MS);
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message);
      // Proceed to the next page to avoid halting entire run
      page += 1;
      await delay(REQUEST_DELAY_MS);
    }
  }

  console.log(`OpenLibrary seed complete. Inserted=${totalInserted}, Skipped=${totalSkipped}`);

  // Optional: backfill genres catalog after seeding
  try {
    const { db } = await import("../config/db.js");
    const { booksTable, genresCatalogTable } = await import("../db/schema.js");
    const { inserted } = await backfillGenresCatalog(db, { booksTable, genresCatalogTable });
    console.log(`Genres catalog backfill complete. Inserted=${inserted}`);
  } catch (e) {
    console.warn("Genres catalog backfill skipped:", e?.message || e);
  }
}

// Allow running directly via npm script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}


