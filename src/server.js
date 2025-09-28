import express from "express";
import { env } from "./config/env.js";
import { db } from "./config/db.js";
import { favouritesTable } from "./db/schema.js";

const PORT = env.PORT;
const app = express();

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

app.post("/api/v1/favourites", async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if(!userId || !bookId) {
      return res.status(400).json({ success: false, message: "UserId and bookId are required" });
    }
    const favourite = await db.insert(favouritesTable).values({ userId, bookId }).returning();
    res.status(201).json({ success: true, data: favourite[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/v1/favourites/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const favourites = await db.delete(favouritesTable).where(eq(favouritesTable.id, id));
    res.status(200).json({ success: true, data: favourites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});