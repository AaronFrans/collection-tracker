import { useState } from "react";

export function NamedListManager({ items, onCreate, onDelete, placeholder, readOnly = false }) {
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  }

  return (
    <div className="named-list-manager">
      {!readOnly && (
        <form className="field-row" onSubmit={handleSubmit}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} />
          <button type="submit">Add</button>
        </form>
      )}
      {items.length > 0 && (
        <ul className="chip-list">
          {items.map((item) => (
            <li key={item.id} className="chip">
              {item.name}
              {!readOnly && (
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete ${item.name}`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}