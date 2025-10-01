import express from "express";
import cors from "cors";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { env } from "./config/env.js";
import { db } from "./config/db.js";
import { favouritesTable, profilesTable } from "./db/schema.js";
import { cronJob } from "./config/cron.js";

const PORT = env.PORT;
const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware({ secretKey: env.CLERK_SECRET_KEY }));

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

if(env.NODE_ENV === "production") {
  cronJob.start();
}

app.post("/api/v1/favourites", requireAuth(), async (req, res) => {
  try {
    const authUserId = req.auth?.userId;
    const { bookId } = req.body;
    if(!authUserId || !bookId) {
      return res.status(400).json({ success: false, message: "Auth user and bookId are required" });
    }
    const favourite = await db.insert(favouritesTable).values({ userId: authUserId, bookId }).returning();
    res.status(201).json({ success: true, data: favourite[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/v1/favourites/:id", requireAuth(), async (req, res) => {
  try {
    const authUserId = req.auth?.userId;
    const { id } = req.params;
    if(!authUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const favourites = await db.delete(favouritesTable).where(and(eq(favouritesTable.id, id), eq(favouritesTable.userId, authUserId)));
    res.status(200).json({ success: true, data: favourites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/v1/me", requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    if(!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const existing = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, clerkId));
    if(existing.length > 0) {
      return res.status(200).json({ success: true, data: existing[0] });
    }
    const inserted = await db.insert(profilesTable).values({ clerkId }).returning();
    res.status(200).json({ success: true, data: inserted[0] });
  } catch (error) {
    console.error("GET /api/v1/me error", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/v1/me", requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    if(!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { username, avatarUrl, genres } = req.body ?? {};
    const updateData = {};
    if(typeof username === "string") updateData.username = username.trim() || null;
    if(typeof avatarUrl === "string") updateData.avatarUrl = avatarUrl.trim() || null;
    if(Array.isArray(genres)) updateData.genres = genres; // store as JSON array

    if(Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No updatable fields provided" });
    }

    const updated = await db
      .insert(profilesTable)
      .values({ clerkId, ...updateData })
      .onConflictDoUpdate({
        target: profilesTable.clerkId,
        set: updateData,
      })
      .returning();

    res.status(200).json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("PUT /api/v1/me error", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});