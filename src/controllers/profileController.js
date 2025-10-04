import { getOrCreateProfileByClerkId, upsertProfile, createProfile } from "../services/profileService.js";

export async function getMe(req, res) {
  try {
    const clerkId = req.auth?.userId;
    if(!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const profile = await getOrCreateProfileByClerkId(clerkId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("GET /api/v1/me error", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateMe(req, res) {
  try {
    const clerkId = req.auth?.userId;
    if(!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { username, avatarUrl, genres, dateOfBirth, language, region } = req.body ?? {};
    const updateData = {};
    if(typeof username === "string") updateData.username = username.trim() || null;
    if(typeof avatarUrl === "string") updateData.avatarUrl = avatarUrl.trim() || null;
    if(Array.isArray(genres)) updateData.genres = genres;
    if(typeof dateOfBirth === "string") updateData.dateOfBirth = dateOfBirth || null; // ISO YYYY-MM-DD
    if(typeof language === "string") updateData.language = language.trim() || null;
    if(typeof region === "string") updateData.region = region.trim() || null;

    if(Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No updatable fields provided" });
    }

    const updated = await upsertProfile(clerkId, updateData);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/v1/me error", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createMe(req, res) {
  try {
    const clerkId = req.auth?.userId;
    if(!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const profile = await createProfile(clerkId);
    res.status(200).json({ success: true, data: profile });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
