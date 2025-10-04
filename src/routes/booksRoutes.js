import express from "express";
import { requireAuth } from "@clerk/express";
import { getBooks, getBook, getGenres } from "../controllers/booksController.js";

const router = express.Router();

router.get("/books", requireAuth(), getBooks);
router.get("/books/:id", requireAuth(), getBook);
router.get("/genres", requireAuth(), getGenres);

export default router;