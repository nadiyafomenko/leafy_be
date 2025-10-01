import express from "express";
import { requireAuth } from "@clerk/express";
import { getMe, updateMe } from "../controllers/profileController.js";

const router = express.Router();

router.get("/me", requireAuth(), getMe);
router.put("/me", requireAuth(), updateMe);

export default router;


