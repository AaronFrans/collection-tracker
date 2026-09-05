import { Router } from "express";
import { db } from "../db.js";

export const typesRouter = Router();

typesRouter.get("/", async (req, res) => {
  const result = await db.execute("SELECT * FROM types ORDER BY name COLLATE NOCASE");
  res.json(result.rows.map((row) => ({ id: row.id, name: row.name })));
});

typesRouter.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const result = await db.execute({
      sql: "INSERT INTO types (name) VALUES (?) RETURNING *",
      args: [name.trim()],
    });
    res.status(201).json({ id: result.rows[0].id, name: result.rows[0].name });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "a type with that name already exists" });
    }
    throw err;
  }
});

typesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const inUse = await db.execute({ sql: "SELECT id FROM items WHERE type_id = ? LIMIT 1", args: [id] });
  if (inUse.rows.length > 0) {
    return res.status(409).json({ error: "type is still used by one or more items" });
  }
  const result = await db.execute({ sql: "DELETE FROM types WHERE id = ? RETURNING id", args: [id] });
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "not found" });
  }
  res.status(204).send();
});
