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
      parent_id INTEGER REFERENCES items(id),
      wishlist INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS item_categories (
      item_id INTEGER NOT NULL REFERENCES items(id),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      PRIMARY KEY (item_id, category_id)
    )
  `);

  const columns = (await db.execute("PRAGMA table_info(items)")).rows;
  const hasCategoryId = columns.some((row) => row.name === "category_id");
  const hasTypeId = columns.some((row) => row.name === "type_id");
  const hasLegacyType = columns.some((row) => row.name === "type");
  const hasPlatform = columns.some((row) => row.name === "platform");
  const hasCondition = columns.some((row) => row.name === "condition");
  const hasPurchasePrice = columns.some((row) => row.name === "purchase_price");
  const hasWishlist = columns.some((row) => row.name === "wishlist");
  const hasParentId = columns.some((row) => row.name === "parent_id");

  if (!hasTypeId) {
    await db.execute("ALTER TABLE items ADD COLUMN type_id INTEGER REFERENCES types(id)");
  }
  if (!hasWishlist) {
    await db.execute("ALTER TABLE items ADD COLUMN wishlist INTEGER NOT NULL DEFAULT 0");
  }
  if (!hasParentId) {
    await db.execute("ALTER TABLE items ADD COLUMN parent_id INTEGER REFERENCES items(id)");
  }
  if (hasPlatform) {
    await db.execute("ALTER TABLE items DROP COLUMN platform");
  }
  if (hasCondition) {
    await db.execute("ALTER TABLE items DROP COLUMN condition");
  }
  if (hasPurchasePrice) {
    await db.execute("ALTER TABLE items DROP COLUMN purchase_price");
  }

  if (hasCategoryId) {
    // Older databases had a single `category_id` column on items — move that into the new
    // many-to-many item_categories table, then drop the column.
    await db.execute(`
      INSERT OR IGNORE INTO item_categories (item_id, category_id)
      SELECT id, category_id FROM items WHERE category_id IS NOT NULL
    `);
    await db.execute("ALTER TABLE items DROP COLUMN category_id");
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
        parent_id INTEGER REFERENCES items(id),
        wishlist INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    await db.execute(`
      INSERT INTO items_new (id, type_id, title, parent_id, wishlist, notes, created_at, updated_at)
      SELECT id, type_id, title, parent_id, wishlist, notes, created_at, updated_at FROM items
    `);
    await db.execute("DROP TABLE items");
    await db.execute("ALTER TABLE items_new RENAME TO items");
  }
}