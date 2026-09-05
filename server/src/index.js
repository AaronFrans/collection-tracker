import express from "express";
import cors from "cors";
import "dotenv/config";
import { migrate } from "./db.js";
import { itemsRouter } from "./routes/items.js";
import { categoriesRouter } from "./routes/categories.js";

const app = express();
const port = process.env.PORT || 3001;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/items", itemsRouter);
app.use("/api/categories", categoriesRouter);

await migrate();

app.listen(port, () => {
  console.log(`Collection Tracker API listening on port ${port}`);
});