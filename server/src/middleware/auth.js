export function requireAuth(req, res, next) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    return res.status(500).json({ error: "Server is not configured with APP_PASSWORD" });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (token !== password) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}