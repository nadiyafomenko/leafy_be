export function getHealth(req, res) {
  res.status(200).json({ success: true, message: "Server is running" });
}


