import { useEffect, useState } from "react";

const EMPTY = {
  typeId: "",
  title: "",
  categoryIds: [],
  parentId: "",
  wishlist: false,
  notes: "",
};

export function ItemForm({ onSubmit, initial, onCancel, types = [], categories = [], items = [] }) {
  const [form, setForm] = useState(
    initial
      ? {
          ...EMPTY,
          ...initial,
          typeId: initial.typeId ?? "",
          categoryIds: (initial.categories ?? []).map((category) => category.id),
          parentId: initial.parentId ?? "",
        }
      : { ...EMPTY, typeId: types[0]?.id ?? "" }
  );

  // `types` loads asynchronously — if this form (for a new item) mounted before it arrived,
  // the initial state above locked in an empty typeId. Fill it in once types show up.
  useEffect(() => {
    if (!initial && form.typeId === "" && types.length > 0) {
      setForm((prev) => ({ ...prev, typeId: types[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types]);

  // Only top-level items can be a parent — keeps the hierarchy to one level.
  const parentOptions = items.filter((item) => item.parentId == null && item.id !== initial?.id);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(categoryId) {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      typeId: form.typeId === "" ? null : Number(form.typeId),
      parentId: form.parentId === "" ? null : Number(form.parentId),
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
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.wishlist}
            onChange={(e) => update("wishlist", e.target.checked)}
          />
          Wishlist
        </label>
      </div>

      {parentOptions.length > 0 && (
        <label>
          Part of collection
          <select value={form.parentId} onChange={(e) => update("parentId", e.target.value)}>
            <option value="">None — top-level item</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      )}

      {categories.length > 0 && (
        <div className="field-block">
          <span className="field-label">Categories</span>
          <div className="checkbox-grid">
            {categories.map((category) => (
              <label key={category.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.categoryIds.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>
      )}

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
