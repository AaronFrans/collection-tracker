export function requireAuth(req, res, next) {
  const adminPassword = process.env.APP_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: "Server is not configured with APP_PASSWORD" });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    req.role = "readonly";
    return next();
  }
  if (token === adminPassword) {
    req.role = "admin";
    return next();
  }
  return res.status(401).json({ error: "unauthorized" });
}

export function requireWrite(req, res, next) {
  if (req.role !== "admin") {
    return res.status(403).json({ error: "read-only access" });
  }
  next();
}