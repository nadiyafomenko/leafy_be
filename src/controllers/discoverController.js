import { getDiscoverFeed } from "../services/discoverService.js";

export async function getDiscover(req, res) {
  try {
    const clerkId = req.auth?.userId;
    if(!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 20)));
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const { items, nextCursor } = await getDiscoverFeed({ clerkId, limit, cursor });

    res.status(200).json({ success: true, data: { items, nextCursor } });
  } catch (error) {
    console.error("GET /api/v1/discover error", error);
    res.status(500).json({ success: false, message: error.message });
  }
}


