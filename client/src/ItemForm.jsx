import { useState } from "react";

const EMPTY = {
  typeId: "",
  title: "",
  platform: "",
  categoryId: "",
  condition: "",
  purchasePrice: "",
  notes: "",
};

export function ItemForm({ onSubmit, initial, onCancel, types = [], categories = [] }) {
  const [form, setForm] = useState(
    initial
      ? { ...EMPTY, ...initial, typeId: initial.typeId ?? "", categoryId: initial.categoryId ?? "" }
      : { ...EMPTY, typeId: types[0]?.id ?? "" }
  );

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      typeId: form.typeId === "" ? null : Number(form.typeId),
      categoryId: form.categoryId === "" ? null : Number(form.categoryId),
      purchasePrice: form.purchasePrice === "" ? null : Number(form.purchasePrice),
    });
    if (!initial) setForm({ ...EMPTY, typeId: types[0]?.id ?? "" });
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label>
          Type
          <select required value={form.typeId} onChange={(e) => update("typeId", e.target.value)}>
            <option value="" disabled>
              Select type
            </option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
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
        <label>
          Platform
          <input
            value={form.platform || ""}
            onChange={(e) => update("platform", e.target.value)}
            placeholder="e.g. Switch"
          />
        </label>
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