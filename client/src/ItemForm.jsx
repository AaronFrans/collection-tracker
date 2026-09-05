import { useState } from "react";

const EMPTY = {
  type: "game",
  title: "",
  platform: "",
  categoryId: "",
  condition: "",
  purchasePrice: "",
  notes: "",
};

export function ItemForm({ onSubmit, initial, onCancel, categories = [] }) {
  const [form, setForm] = useState(
    initial ? { ...EMPTY, ...initial, categoryId: initial.categoryId ?? "" } : EMPTY
  );

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      categoryId: form.categoryId === "" ? null : Number(form.categoryId),
      purchasePrice: form.purchasePrice === "" ? null : Number(form.purchasePrice),
    });
    if (!initial) setForm(EMPTY);
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label>
          Type
          <select value={form.type} onChange={(e) => update("type", e.target.value)}>
            <option value="game">Game</option>
            <option value="collectible">Collectible</option>
          </select>
        </label>
        <label className="grow">
          Title
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Super Mario Odyssey"
          />
        </label>
      </div>
      <div className="field-row">
        {form.type === "game" && (
          <label>
            Platform
            <input
              value={form.platform || ""}
              onChange={(e) => update("platform", e.target.value)}
              placeholder="e.g. Switch"
            />
          </label>
        )}
        <label>
          Category
          <select value={form.categoryId ?? ""} onChange={(e) => update("categoryId", e.target.value)}>
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Condition
          <input
            value={form.condition || ""}
            onChange={(e) => update("condition", e.target.value)}
            placeholder="e.g. Sealed, CIB, Loose"
          />
        </label>
        <label>
          Purchase price
          <input
            type="number"
            step="0.01"
            value={form.purchasePrice ?? ""}
            onChange={(e) => update("purchasePrice", e.target.value)}
          />
        </label>
      </div>
      <label>
        Notes
        <textarea value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} rows={2} />
      </label>
      <div className="field-row">
        <button type="submit">{initial ? "Save" : "Add item"}</button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
