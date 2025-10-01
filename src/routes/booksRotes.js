import express from "express";
import { requireAuth } from "@clerk/express";
import { getBooks, getBook } from "../controllers/booksController.js";

const router = express.Router();

router.get("/books", requireAuth(), getBooks);
router.get("/books/:id", requireAuth(), getBook);

export default router;