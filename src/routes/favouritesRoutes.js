import express from "express";
import { requireAuth } from "@clerk/express";
import { createFavourite, deleteFavourite } from "../controllers/favouritesController.js";

const router = express.Router();

router.post("/favourites", requireAuth(), createFavourite);
router.delete("/favourites/:id", requireAuth(), deleteFavourite);

export default router;


