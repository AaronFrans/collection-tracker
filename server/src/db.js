import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set — copy .env.example to .env and fill it in.");
}

export const db = createClient({ url, authToken });

export async function migrate() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('game', 'collectible')),
      title TEXT NOT NULL,
      platform TEXT,
      category_id INTEGER REFERENCES categories(id),
      condition TEXT,
      purchase_price REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Older databases created before categories existed have a plain `category` TEXT
  // column instead of `category_id` — add the new column alongside it if missing.
  const columns = await db.execute("PRAGMA table_info(items)");
  const hasCategoryId = columns.rows.some((row) => row.name === "category_id");
  if (!hasCategoryId) {
    await db.execute("ALTER TABLE items ADD COLUMN category_id INTEGER REFERENCES categories(id)");
  }
}