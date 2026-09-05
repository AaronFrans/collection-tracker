import { Router } from "express";
import { db } from "../db.js";
import { requireWrite } from "../middleware/auth.js";
import { asyncHandler } from "../asyncHandler.js";

export const itemsRouter = Router();

function toItem(row) {
  return {
    id: row.id,
    typeId: row.type_id,
    typeName: row.type_name,
    title: row.title,
    parentId: row.parent_id,
    parentTitle: row.parent_title,
    wishlist: !!row.wishlist,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categories: [],
  };
}

async function attachCategories(items) {
  if (items.length === 0) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const placeholders = items.map(() => "?").join(", ");
  const result = await db.execute({
    sql: `
      SELECT item_categories.item_id, categories.id, categories.name
      FROM item_categories
      JOIN categories ON categories.id = item_categories.category_id
      WHERE item_categories.item_id IN (${placeholders})
      ORDER BY categories.name COLLATE NOCASE
    `,
    args: items.map((item) => item.id),
  });
  for (const row of result.rows) {
    byId.get(row.item_id).categories.push({ id: row.id, name: row.name });
  }
  return items;
}

async function typeExists(typeId) {
  const result = await db.execute({ sql: "SELECT id FROM types WHERE id = ?", args: [typeId] });
  return result.rows.length > 0;
}

async function categoryIdsExist(categoryIds) {
  if (categoryIds.length === 0) return true;
  const placeholders = categoryIds.map(() => "?").join(", ");
  const result = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM categories WHERE id IN (${placeholders})`,
    args: categoryIds,
  });
  return result.rows[0].count === categoryIds.length;
}

async function setItemCategories(itemId, categoryIds) {
  await db.execute({ sql: "DELETE FROM item_categories WHERE item_id = ?", args: [itemId] });
  for (const categoryId of categoryIds) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO item_categories (item_id, category_id) VALUES (?, ?)",
      args: [itemId, categoryId],
    });
  }
}

// Kept to one level: a parent must not itself be someone's child, and must not already be a leaf
// under another parent. Returns an error string, or null if parentId is usable.
async function validateParent(parentId, selfId) {
  if (parentId == null) return null;
  if (selfId != null && Number(parentId) === Number(selfId)) {
    return "an item cannot be its own parent";
  }
  const parent = await db.execute({ sql: "SELECT id, parent_id FROM items WHERE id = ?", args: [parentId] });
  if (parent.rows.length === 0) {
    return "parentId does not exist";
  }
  if (parent.rows[0].parent_id != null) {
    return "parentId already belongs to another collection — only one level of nesting is allowed";
  }
  if (selfId != null) {
    const children = await db.execute({ sql: "SELECT id FROM items WHERE parent_id = ? LIMIT 1", args: [selfId] });
    if (children.rows.length > 0) {
      return "this item already has its own sub-items and can't become a sub-item itself";
    }
  }
  return null;
}

const SELECT_ITEMS = `
  SELECT items.*, types.name AS type_name, parent.title AS parent_title
  FROM items
  JOIN types ON types.id = items.type_id
  LEFT JOIN items AS parent ON parent.id = items.parent_id
`;

itemsRouter.get("/", asyncHandler(async (req, res) => {
  const { typeId, categoryId, wishlist, parentId, q } = req.query;
  const clauses = [];
  const args = [];

  if (typeId) {
    clauses.push("items.type_id = ?");
    args.push(typeId);
  }
  if (categoryId) {
    clauses.push("EXISTS (SELECT 1 FROM item_categories WHERE item_categories.item_id = items.id AND item_categories.category_id = ?)");
    args.push(categoryId);
  }
  if (wishlist !== undefined) {
    clauses.push("items.wishlist = ?");
    args.push(wishlist === "true" ? 1 : 0);
  }
  if (parentId !== undefined) {
    if (parentId === "none") {
      clauses.push("items.parent_id IS NULL");
    } else {
      clauses.push("items.parent_id = ?");
      args.push(parentId);
    }
  }
  if (q) {
    clauses.push(`(
      items.title LIKE ?
      OR EXISTS (
        SELECT 1 FROM item_categories
        JOIN categories ON categories.id = item_categories.category_id
        WHERE item_categories.item_id = items.id AND categories.name LIKE ?
      )
    )`);
    args.push(`%${q}%`, `%${q}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await db.execute({
    sql: `${SELECT_ITEMS} ${where} ORDER BY items.created_at DESC`,
    args,
  });
  res.json(await attachCategories(result.rows.map(toItem)));
}));

itemsRouter.post("/", requireWrite, asyncHandler(async (req, res) => {
  const { typeId, title, categoryIds, parentId, wishlist, notes } = req.body;
  const cleanCategoryIds = Array.isArray(categoryIds) ? [...new Set(categoryIds)] : [];

  if (!typeId || !(await typeExists(typeId))) {
    return res.status(400).json({ error: "typeId is required and must reference an existing type" });
  }
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }
  if (!(await categoryIdsExist(cleanCategoryIds))) {
    return res.status(400).json({ error: "one or more categoryIds do not exist" });
  }
  const parentError = await validateParent(parentId ?? null, null);
  if (parentError) {
    return res.status(400).json({ error: parentError });
  }

  const inserted = await db.execute({
    sql: `INSERT INTO items (type_id, title, parent_id, wishlist, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          RETURNING id`,
    args: [typeId, title, parentId ?? null, wishlist ? 1 : 0, notes ?? null],
  });
  const itemId = inserted.rows[0].id;
  await setItemCategories(itemId, cleanCategoryIds);

  const result = await db.execute({ sql: `${SELECT_ITEMS} WHERE items.id = ?`, args: [itemId] });
  const [item] = await attachCategories(result.rows.map(toItem));
  res.status(201).json(item);
}));

itemsRouter.put("/:id", requireWrite, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { typeId, title, categoryIds, parentId, wishlist, notes } = req.body;

  const existing = await db.execute({ sql: "SELECT * FROM items WHERE id = ?", args: [id] });
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: "not found" });
  }
  const current = existing.rows[0];

  const nextTypeId = typeId ?? current.type_id;
  if (!(await typeExists(nextTypeId))) {
    return res.status(400).json({ error: "typeId does not exist" });
  }
  const nextWishlist = wishlist !== undefined ? (wishlist ? 1 : 0) : current.wishlist;

  let nextParentId = current.parent_id;
  if (parentId !== undefined) {
    const parentError = await validateParent(parentId, id);
    if (parentError) {
      return res.status(400).json({ error: parentError });
    }
    nextParentId = parentId;
  }

  if (categoryIds !== undefined) {
    const cleanCategoryIds = Array.isArray(categoryIds) ? [...new Set(categoryIds)] : [];
    if (!(await categoryIdsExist(cleanCategoryIds))) {
      return res.status(400).json({ error: "one or more categoryIds do not exist" });
    }
    await setItemCategories(id, cleanCategoryIds);
  }

  await db.execute({
    sql: `UPDATE items SET
            type_id = ?, title = ?, parent_id = ?, wishlist = ?, notes = ?,
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [nextTypeId, title ?? current.title, nextParentId, nextWishlist, notes ?? current.notes, id],
  });
  const result = await db.execute({ sql: `${SELECT_ITEMS} WHERE items.id = ?`, args: [id] });
  const [item] = await attachCategories(result.rows.map(toItem));
  res.json(item);
}));

itemsRouter.delete("/:id", requireWrite, asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Sub-items of a deleted collection become top-level items rather than being deleted too.
  await db.execute({ sql: "UPDATE items SET parent_id = NULL WHERE parent_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM item_categories WHERE item_id = ?", args: [id] });
  const result = await db.execute({ sql: "DELETE FROM items WHERE id = ? RETURNING id", args: [id] });
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "not found" });
  }
  res.status(204).send();
}));
