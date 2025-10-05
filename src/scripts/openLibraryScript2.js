// openlibrary-book.js
// Node 18+ (вбудований fetch). Виклик: node openlibrary-book.js "your query"

const BASE = "https://openlibrary.org";
const COVERS = "https://covers.openlibrary.org/b/id";

async function getJSON(url, params) {
  const u = new URL(url);
  if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  const r = await fetch(u, { headers: { "User-Agent": "demo-script/1.0" } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${u}`);
  return r.json();
}

function normDesc(d) {
  if (!d) return null;
  if (typeof d === "string") return d;
  if (typeof d === "object" && typeof d.value === "string") return d.value;
  return null;
}

function langIsUkr(l) {
  // Open Library представляє мови як об'єкти { key: "/languages/ukr" }
  if (!l) return false;
  if (typeof l === "string") return /\/languages\/ukr$/.test(l) || l === "ukr" || l === "uk";
  if (typeof l === "object") return langIsUkr(l.key);
  return false;
}

function editionLanguages(ed) {
  // можливі поля: languages, publish_languages, language (різні джерела)
  const arr = []
    .concat(ed.languages || [])
    .concat(ed.publish_languages || [])
    .concat(ed.language || []);
  // уніфікуємо до коротких кодів типу "ukr"/останній сегмент
  return arr
    .map(x => (typeof x === "object" ? x.key : x))
    .filter(Boolean)
    .map(s => (s.includes("/languages/") ? s.split("/").pop() : s));
}

function coverUrlFromId(id, size = "L") {
  return id ? `${COVERS}/${id}-${size}.jpg` : null;
}

async function fetchAllEditions(workId, limitPerPage = 100, hardCap = 800) {
  // /works/{id}/editions.json має пагінацію через "links.next"
  let url = `${BASE}/works/${workId}/editions.json?limit=${limitPerPage}`;
  const all = [];
  while (url && all.length < hardCap) {
    const page = await getJSON(url);
    const entries = page.entries || page.editions || [];
    all.push(...entries);
    const next = page.links?.next;
    url = next ? (next.startsWith("http") ? next : `${BASE}${next}`) : null;
  }
  return all;
}

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error("Usage: node openlibrary-book.js \"your search query\"");
    process.exit(1);
  }

  // 1) Пошук — забираємо мінімум полів, щоб швидко
  const search = await getJSON(`${BASE}/search.json`, {
    q: query,
    limit: 1,
    fields: [
      "key",
      "title",
      "author_name",
      "author_key",
      "cover_i",
      "first_publish_year",
      "language"
    ].join(","),
  });

  const doc = (search.docs || [])[0];
  if (!doc) {
    console.log({ error: "Nothing found for query", query });
    return;
  }

  const workKey = (doc.key || "").replace("/works/", "");
  const title = doc.title || null;
  const coverI = doc.cover_i || null;
  const searchAuthor = (doc.author_name || [])[0] || null;

  // 2) Деталі твору: опис, сабджекти, автор(и)
  const work = await getJSON(`${BASE}/works/${workKey}.json`);
  const description = normDesc(work.description);
  const subjects = Array.isArray(work.subjects) ? work.subjects : [];
  // Автор — беремо з search якщо є, інакше підтягнемо перший з /authors
  let author = searchAuthor;
  if (!author && Array.isArray(work.authors) && work.authors[0]?.author?.key) {
    try {
      const authId = work.authors[0].author.key.replace("/authors/", "");
      const auth = await getJSON(`${BASE}/authors/${authId}.json`);
      author = auth.name || null;
    } catch {}
  }

  // 3) Видання (editions) — шукаємо українські
  const editions = await fetchAllEditions(workKey, 100, 800);

  const normalized = editions.map((ed) => {
    const langs = editionLanguages(ed);
    const isUkr = langs.includes("ukr") || langs.includes("uk");
    const coverId =
      (Array.isArray(ed.covers) && ed.covers[0]) ||
      (ed.cover_id ?? null); // інколи буває cover_id
    return {
      edition_key: ed.key || ed.edition_key || null, // типово "/books/OL23253074M"
      title: ed.title || null,
      languages: langs,
      isUkrainian: isUkr,
      publish_year: ed.publish_date || ed.publish_year || null,
      publishers: ed.publishers || [],
      isbn_13: ed.isbn_13 || [],
      cover_url: coverUrlFromId(coverId, "L"),
    };
  });

  const ukrEditions = normalized.filter(e => e.isUkrainian);
  const firstUkrCover = ukrEditions.find(e => e.cover_url)?.cover_url;

  // 4) Обкладинка: пріоритет — з українського видання → зі сторінки пошуку → із work.covers
  let cover =
    firstUkrCover ||
    coverUrlFromId(coverI, "L") ||
    coverUrlFromId(Array.isArray(work.covers) ? work.covers[0] : null, "L") ||
    null;

  // 5) Готовий результат
  const result = {
    workKey: workKey ? `/works/${workKey}` : null,
    title,
    author,
    description,
    subjects,
    cover,
    editions: {
      ukrainianCount: ukrEditions.length,
      ukrainian: ukrEditions.slice(0, 10), // показуємо до 10 для стислості
      totalCount: normalized.length,
      sampleOthers: normalized.filter(e => !e.isUkrainian).slice(0, 5),
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
