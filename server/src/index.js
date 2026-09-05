import express from "express";
import cors from "cors";
import "dotenv/config";
import { migrate } from "./db.js";
import { itemsRouter } from "./routes/items.js";
import { categoriesRouter } from "./routes/categories.js";
import { typesRouter } from "./routes/types.js";
import { requireAuth, requireWrite } from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 3001;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.post("/api/auth/check", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token || token !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: "unauthorized" });
  }
  res.json({ ok: true });
});
app.use("/api/items", requireAuth, itemsRouter);
app.use("/api/categories", requireAuth, categoriesRouter);
app.use("/api/types", requireAuth, typesRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

await migrate();

app.listen(port, () => {
  console.log(`Collection Tracker API listening on port ${port}`);
});