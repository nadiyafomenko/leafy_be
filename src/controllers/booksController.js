import { getBooks as getBooksService, getBook as getBookService } from "../services/booksService.js";

export async function getBooks(req, res) {
  try {
    const books = await getBooksService();
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getBook(req, res) {
  try {
    const { id } = req.params;
    const rows = await getBookService({ bookId: id });
    res.status(200).json({ success: true, data: rows?.[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


