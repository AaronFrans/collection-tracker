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
    CREATE TABLE IF NOT EXISTS types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);
  const typeCount = await db.execute("SELECT COUNT(*) AS count FROM types");
  if (typeCount.rows[0].count === 0) {
    await db.execute({ sql: "INSERT INTO types (name) VALUES (?), (?)", args: ["Game", "Collectible"] });
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_id INTEGER NOT NULL REFERENCES types(id),
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

  const columns = (await db.execute("PRAGMA table_info(items)")).rows;
  const hasCategoryId = columns.some((row) => row.name === "category_id");
  const hasTypeId = columns.some((row) => row.name === "type_id");
  const hasLegacyType = columns.some((row) => row.name === "type");

  if (!hasCategoryId) {
    await db.execute("ALTER TABLE items ADD COLUMN category_id INTEGER REFERENCES categories(id)");
  }
  if (!hasTypeId) {
    await db.execute("ALTER TABLE items ADD COLUMN type_id INTEGER REFERENCES types(id)");
  }

  if (hasLegacyType) {
    // Older databases had a hardcoded `type TEXT CHECK (type IN ('game','collectible'))` column.
    // Backfill type_id from it, then rebuild the table to drop the old column and its CHECK constraint
    // (SQLite can't alter/drop a column or constraint in place).
    const gameType = await db.execute({ sql: "SELECT id FROM types WHERE name = ?", args: ["Game"] });
    const collectibleType = await db.execute({ sql: "SELECT id FROM types WHERE name = ?", args: ["Collectible"] });
    await db.execute({
      sql: "UPDATE items SET type_id = ? WHERE type = 'game' AND type_id IS NULL",
      args: [gameType.rows[0].id],
    });
    await db.execute({
      sql: "UPDATE items SET type_id = ? WHERE type = 'collectible' AND type_id IS NULL",
      args: [collectibleType.rows[0].id],
    });

    await db.execute(`
      CREATE TABLE items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type_id INTEGER NOT NULL REFERENCES types(id),
        title TEXT NOT NULL,
        platform TEXT,
        category_id INTEGER REFERENCES categories(id),
        condition TEXT,
        purchase_price REAL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    await db.execute(`
      INSERT INTO items_new (id, type_id, title, platform, category_id, condition, purchase_price, notes, created_at, updated_at)
      SELECT id, type_id, title, platform, category_id, condition, purchase_price, notes, created_at, updated_at FROM items
    `);
    await db.execute("DROP TABLE items");
    await db.execute("ALTER TABLE items_new RENAME TO items");
  }
}