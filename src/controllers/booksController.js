import { getBooks, getBook } from "../services/favouritesService.js";

export async function getBooks(req, res) {
  try {
    const authUserId = req.auth?.userId;
    const { bookId } = req.body;
    if(!authUserId || !bookId) {
      return res.status(400).json({ success: false, message: "Auth user are required" });
    }
    const favourite = await getBooks({ userId: authUserId });
    res.status(201).json({ success: true, data: favourite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getBook(req, res) {
  try {
    const authUserId = req.auth?.userId;
    const { id } = req.params;
    if(!authUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const favourites = await removeFavouriteByIdForUser({ favouriteId: id, userId: authUserId });
    res.status(200).json({ success: true, data: favourites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


