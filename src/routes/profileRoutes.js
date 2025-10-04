import express from "express";
import { requireAuth } from "@clerk/express";
import { getMe, updateMe, createMe } from "../controllers/profileController.js";

const router = express.Router();

router.get("/me", requireAuth(), getMe);
router.put("/me", requireAuth(), updateMe);
router.post("/me", requireAuth(), createMe);

export default router;


