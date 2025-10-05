import OpenAI from "openai";
import { env } from "../config/env.js";

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

function buildPrompt(profile, candidates) {
  const lines = candidates.map(c => JSON.stringify({
    id: c.id,
    title: c.title,
    author: c.author,
    genres: c.genres,
    desc: c.desc,
    popularity: c.popularity ?? 0,
    recency: c.recency,
    lang: c.lang,
  }));

  return [
    "You are a ranking model for book recommendations. Return strict JSON only.",
    "User profile:",
    `- Lang: ${profile?.language || ""}`,
    `- Region: ${profile?.region || ""}`,
    `- Favorite genres: ${(profile?.genres || []).join(", ")}`,
    `- Favorite authors: ${(profile?.favoriteAuthors || []).join(", ")}`,
    "Candidates (each line is one JSON):",
    ...lines,
    "Task:",
    "Rank candidates from most to least relevant for this user. Consider language, genre and author affinity, semantic fit of description, popularity and recency as tie-breakers.",
    "Return JSON: {\"ranked\": [{\"id\": \"<bookId>\", \"score\": <0..1>}, ...]}"
  ].join("\n");
}

export async function rerankWithLLM(profile, candidates) {
  if(!env.OPENAI_API_KEY || !candidates?.length) return candidates.map(c => ({ id: c.id, score: 0.5 }));

  const prompt = buildPrompt(profile, candidates);
  try {
    const chat = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: "You are a ranking model returning strict JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });
    const text = chat.choices?.[0]?.message?.content?.trim() || "";
    console.log('text', text);
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    const body = JSON.parse(text.slice(jsonStart, jsonEnd));
    const ranked = Array.isArray(body?.ranked) ? body.ranked : [];
    // sanitize to only known ids
    const allowed = new Set(candidates.map(c => String(c.id)));
    return ranked
      .filter(item => allowed.has(String(item.id)))
      .map(item => ({ id: String(item.id), score: Number(item.score) || 0 }))
      .slice(0, candidates.length);
  } catch (e) {
    // fallback: neutral scores
    return candidates.map(c => ({ id: c.id, score: 0.5 }));
  }
}


