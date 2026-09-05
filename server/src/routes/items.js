import { Router } from "express";
import { db } from "../db.js";

export const itemsRouter = Router();

const SELECT_ITEMS = `
  SELECT items.*, categories.name AS category_name, types.name AS type_name
  FROM items
  LEFT JOIN categories ON categories.id = items.category_id
  JOIN types ON types.id = items.type_id
`;

function toItem(row) {
  return {
    id: row.id,
    typeId: row.type_id,
    typeName: row.type_name,
    title: row.title,
    platform: row.platform,
    categoryId: row.category_id,
    categoryName: row.category_name,
    condition: row.condition,
    purchasePrice: row.purchase_price,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function typeExists(typeId) {
  const result = await db.execute({ sql: "SELECT id FROM types WHERE id = ?", args: [typeId] });
  return result.rows.length > 0;
}

async function categoryExists(categoryId) {
  if (categoryId == null) return true;
  const result = await db.execute({ sql: "SELECT id FROM categories WHERE id = ?", args: [categoryId] });
  return result.rows.length > 0;
}

itemsRouter.get("/", async (req, res) => {
  const { typeId, categoryId, q } = req.query;
  const clauses = [];
  const args = [];

  if (typeId) {
    clauses.push("items.type_id = ?");
    args.push(typeId);
  }
  if (categoryId) {
    clauses.push("items.category_id = ?");
    args.push(categoryId);
  }
  if (q) {
    clauses.push("(items.title LIKE ? OR items.platform LIKE ? OR categories.name LIKE ?)");
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await db.execute({
    sql: `${SELECT_ITEMS} ${where} ORDER BY items.created_at DESC`,
    args,
  });
  res.json(result.rows.map(toItem));
});

itemsRouter.post("/", async (req, res) => {
  const { typeId, title, platform, categoryId, condition, purchasePrice, notes } = req.body;

  if (!typeId || !(await typeExists(typeId))) {
    return res.status(400).json({ error: "typeId is required and must reference an existing type" });
  }
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }
  if (!(await categoryExists(categoryId ?? null))) {
    return res.status(400).json({ error: "categoryId does not exist" });
  }

  const inserted = await db.execute({
    sql: `INSERT INTO items (type_id, title, platform, category_id, condition, purchase_price, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          RETURNING id`,
    args: [typeId, title, platform ?? null, categoryId ?? null, condition ?? null, purchasePrice ?? null, notes ?? null],
  });
  const result = await db.execute({ sql: `${SELECT_ITEMS} WHERE items.id = ?`, args: [inserted.rows[0].id] });
  res.status(201).json(toItem(result.rows[0]));
});

itemsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { typeId, title, platform, categoryId, condition, purchasePrice, notes } = req.body;

  const existing = await db.execute({ sql: "SELECT * FROM items WHERE id = ?", args: [id] });
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: "not found" });
  }
  const current = existing.rows[0];

  const nextTypeId = typeId ?? current.type_id;
  if (!(await typeExists(nextTypeId))) {
    return res.status(400).json({ error: "typeId does not exist" });
  }
  const nextCategoryId = categoryId !== undefined ? categoryId : current.category_id;
  if (!(await categoryExists(nextCategoryId))) {
    return res.status(400).json({ error: "categoryId does not exist" });
  }

  await db.execute({
    sql: `UPDATE items SET
            type_id = ?, title = ?, platform = ?, category_id = ?, condition = ?, purchase_price = ?, notes = ?,
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [
      nextTypeId,
      title ?? current.title,
      platform ?? current.platform,
      nextCategoryId,
      condition ?? current.condition,
      purchasePrice ?? current.purchase_price,
      notes ?? current.notes,
      id,
    ],
  });
  const result = await db.execute({ sql: `${SELECT_ITEMS} WHERE items.id = ?`, args: [id] });
  res.json(toItem(result.rows[0]));
});

itemsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const result = await db.execute({ sql: "DELETE FROM items WHERE id = ? RETURNING id", args: [id] });
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "not found" });
  }
  res.status(204).send();
});