import { useEffect, useState } from "react";
import { api } from "./api";
import { ItemForm } from "./ItemForm";
import { ItemList } from "./ItemList";
import { CategoryManager } from "./CategoryManager";
import "./App.css";

export default function App() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshItems() {
    try {
      setError(null);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (search) params.q = search;
      const data = await api.listItems(params);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshCategories() {
    try {
      setCategories(await api.listCategories());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refreshCategories();
  }, []);

  useEffect(() => {
    refreshItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, categoryFilter, search]);

  async function handleCreate(values) {
    try {
      await api.createItem(values);
      refreshItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(id, values) {
    try {
      await api.updateItem(id, values);
      refreshItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteItem(id);
      refreshItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateCategory(name) {
    try {
      await api.createCategory(name);
      refreshCategories();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteCategory(id) {
    try {
      await api.deleteCategory(id);
      refreshCategories();
      refreshItems();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <h1>Collection Tracker</h1>

      <section className="card">
        <h2>Categories</h2>
        <CategoryManager categories={categories} onCreate={handleCreateCategory} onDelete={handleDeleteCategory} />
      </section>

      <section className="card">
        <h2>Add item</h2>
        <ItemForm onSubmit={handleCreate} categories={categories} />
      </section>

      <section className="card">
        <div className="toolbar">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="game">Games</option>
            <option value="collectible">Collectibles</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Search title / platform / category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <ItemList items={items} categories={categories} onUpdate={handleUpdate} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
