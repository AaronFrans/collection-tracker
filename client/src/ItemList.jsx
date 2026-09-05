import { useState } from "react";
import { ItemForm } from "./ItemForm";

export function ItemList({ items, onUpdate, onDelete, types = [], categories = [] }) {
  const [editingId, setEditingId] = useState(null);

  if (items.length === 0) {
    return <p className="empty">Nothing here yet.</p>;
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <li key={item.id} className="item-row">
          {editingId === item.id ? (
            <ItemForm
              initial={item}
              types={types}
              categories={categories}
              onSubmit={(values) => {
                onUpdate(item.id, values);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <div className="item-info">
                <span className="badge">{item.typeName}</span>
                <strong>{item.title}</strong>
                {item.platform && <span className="meta">{item.platform}</span>}
                {item.categoryName && <span className="meta">{item.categoryName}</span>}
                {item.condition && <span className="meta">{item.condition}</span>}
                {item.purchasePrice != null && <span className="meta">${item.purchasePrice.toFixed(2)}</span>}
                {item.notes && <p className="notes">{item.notes}</p>}
              </div>
              <div className="item-actions">
                <button onClick={() => setEditingId(item.id)}>Edit</button>
                <button className="secondary" onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}