import { useEffect, useState } from "react";

const EMPTY = {
  typeId: "",
  title: "",
  categoryId: "",
  wishlist: false,
  notes: "",
};

export function ItemForm({ onSubmit, initial, onCancel, types = [], categories = [] }) {
  const [form, setForm] = useState(
    initial
      ? { ...EMPTY, ...initial, typeId: initial.typeId ?? "", categoryId: initial.categoryId ?? "" }
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

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      typeId: form.typeId === "" ? null : Number(form.typeId),
      categoryId: form.categoryId === "" ? null : Number(form.categoryId),
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
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.wishlist}
            onChange={(e) => update("wishlist", e.target.checked)}
          />
          Wishlist
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