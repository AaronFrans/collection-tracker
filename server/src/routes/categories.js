import { Router } from "express";
import { db } from "../db.js";
import { requireWrite } from "../middleware/auth.js";
import { asyncHandler } from "../asyncHandler.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", asyncHandler(async (req, res) => {
  const result = await db.execute("SELECT * FROM categories ORDER BY name COLLATE NOCASE");
  res.json(result.rows.map((row) => ({ id: row.id, name: row.name })));
}));

categoriesRouter.post("/", requireWrite, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const result = await db.execute({
      sql: "INSERT INTO categories (name) VALUES (?) RETURNING *",
      args: [name.trim()],
    });
    res.status(201).json({ id: result.rows[0].id, name: result.rows[0].name });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "a category with that name already exists" });
    }
    throw err;
  }
}));

categoriesRouter.delete("/:id", requireWrite, asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Items tagged with this category keep their row, just lose that tag.
  await db.execute({ sql: "DELETE FROM item_categories WHERE category_id = ?", args: [id] });
  const result = await db.execute({ sql: "DELETE FROM categories WHERE id = ? RETURNING id", args: [id] });
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "not found" });
  }
  res.status(204).send();
}));
