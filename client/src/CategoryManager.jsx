import { useState } from "react";

export function CategoryManager({ categories, onCreate, onDelete }) {
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  }

  return (
    <div className="category-manager">
      <form className="field-row" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category, e.g. Amiibo"
        />
        <button type="submit">Add category</button>
      </form>
      {categories.length > 0 && (
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id} className="category-chip">
              {category.name}
              <button
                type="button"
                className="chip-remove"
                onClick={() => onDelete(category.id)}
                aria-label={`Delete category ${category.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}