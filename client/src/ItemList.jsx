import { useState } from "react";
import { ItemForm } from "./ItemForm";

function ItemRow({ item, childItems, allItems, onUpdate, onDelete, types, categories, readOnly, editingId, setEditingId }) {
  return (
    <li className="item-row-wrapper">
      <div className="item-row">
        {editingId === item.id ? (
          <ItemForm
            initial={item}
            types={types}
            categories={categories}
            items={allItems}
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
              {item.wishlist && <span className="badge badge-wishlist">Wishlist</span>}
              <strong>{item.title}</strong>
              {item.parentTitle && !childItems && <span className="meta">Part of {item.parentTitle}</span>}
              {item.categories?.map((category) => (
                <span key={category.id} className="meta">
                  {category.name}
                </span>
              ))}
              {item.notes && <p className="notes">{item.notes}</p>}
            </div>
            {!readOnly && (
              <div className="item-actions">
                <button onClick={() => setEditingId(item.id)}>Edit</button>
                <button className="secondary" onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {childItems && childItems.length > 0 && (
        <ul className="item-list item-list-nested">
          {childItems.map((child) => (
            <ItemRow
              key={child.id}
              item={child}
              childItems={null}
              allItems={allItems}
              onUpdate={onUpdate}
              onDelete={onDelete}
              types={types}
              categories={categories}
              readOnly={readOnly}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ItemList({ items, onUpdate, onDelete, types = [], categories = [], readOnly = false }) {
  const [editingId, setEditingId] = useState(null);

  if (items.length === 0) {
    return <p className="empty">Nothing here yet.</p>;
  }

  const topLevelIds = new Set(items.filter((item) => item.parentId == null).map((item) => item.id));
  const childrenByParent = new Map();
  const orphanChildren = [];

  for (const item of items) {
    if (item.parentId == null) continue;
    if (topLevelIds.has(item.parentId)) {
      if (!childrenByParent.has(item.parentId)) childrenByParent.set(item.parentId, []);
      childrenByParent.get(item.parentId).push(item);
    } else {
      // Parent isn't in this filtered view — show as a standalone row with a "Part of" note.
      orphanChildren.push(item);
    }
  }

  const topLevel = items.filter((item) => item.parentId == null);

  return (
    <ul className="item-list">
      {[...topLevel, ...orphanChildren].map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          childItems={childrenByParent.get(item.id) ?? null}
          allItems={items}
          onUpdate={onUpdate}
          onDelete={onDelete}
          types={types}
          categories={categories}
          readOnly={readOnly}
          editingId={editingId}
          setEditingId={setEditingId}
        />
      ))}
    </ul>
  );
}