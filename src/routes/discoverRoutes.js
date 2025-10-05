import express from "express";
import { requireAuth } from "@clerk/express";
import { getDiscover } from "../controllers/discoverController.js";

const router = express.Router();

router.get("/discover", requireAuth(), getDiscover);

export default router;


