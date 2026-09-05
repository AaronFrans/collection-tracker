import { useEffect, useState } from "react";
import { api, UnauthorizedError, ForbiddenError } from "./api";
import { isAdmin, clearToken } from "./auth";
import { ItemForm } from "./ItemForm";
import { ItemList } from "./ItemList";
import { NamedListManager } from "./NamedListManager";
import { Login } from "./Login";
import "./App.css";

export default function App() {
  const [admin, setAdmin] = useState(isAdmin());
  const [showLogin, setShowLogin] = useState(false);
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [wishlistFilter, setWishlistFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  function handleError(err) {
    if (err instanceof UnauthorizedError) {
      setAdmin(false);
      setError("Your session expired — log in again to make changes.");
      return;
    }
    if (err instanceof ForbiddenError) {
      setError("Read-only access — log in to make changes.");
      return;
    }
    setError(err.message);
  }

  async function refreshItems() {
    try {
      setError(null);
      const params = {};
      if (typeFilter) params.typeId = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (wishlistFilter) params.wishlist = wishlistFilter;
      if (search) params.q = search;
      setItems(await api.listItems(params));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshTypes() {
    try {
      setTypes(await api.listTypes());
    } catch (err) {
      handleError(err);
    }
  }

  async function refreshCategories() {
    try {
      setCategories(await api.listCategories());
    } catch (err) {
      handleError(err);
    }
  }

  useEffect(() => {
    refreshTypes();
    refreshCategories();
  }, []);

  useEffect(() => {
    refreshItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, categoryFilter, wishlistFilter, search]);

  async function handleCreate(values) {
    try {
      await api.createItem(values);
      refreshItems();
    } catch (err) {
      handleError(err);
    }
  }

  async function handleUpdate(id, values) {
    try {
      await api.updateItem(id, values);
      refreshItems();
    } catch (err) {
      handleError(err);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteItem(id);
      refreshItems();
    } catch (err) {
      handleError(err);
    }
  }

  async function handleCreateType(name) {
    try {
      await api.createType(name);
      refreshTypes();
    } catch (err) {
      handleError(err);
    }
  }

  async function handleDeleteType(id) {
    try {
      await api.deleteType(id);
      refreshTypes();
    } catch (err) {
      handleError(err);
    }
  }

  async function handleCreateCategory(name) {
    try {
      await api.createCategory(name);
      refreshCategories();
    } catch (err) {
      handleError(err);
    }
  }

  async function handleDeleteCategory(id) {
    try {
      await api.deleteCategory(id);
      refreshCategories();
      refreshItems();
    } catch (err) {
      handleError(err);
    }
  }

  function handleLogout() {
    clearToken();
    setAdmin(false);
  }

  const readOnly = !admin;

  return (
    <div className="app">
      <div className="page-header">
        <h1>Collection Tracker</h1>
        {admin ? (
          <button className="secondary" onClick={handleLogout}>
            Log out
          </button>
        ) : (
          !showLogin && (
            <button className="secondary" onClick={() => setShowLogin(true)}>
              Log in
            </button>
          )
        )}
      </div>

      {showLogin && !admin && (
        <Login
          onSuccess={() => {
            setAdmin(true);
            setShowLogin(false);
            setError(null);
          }}
          onCancel={() => setShowLogin(false)}
        />
      )}

      <section className="card">
        <h2>Types</h2>
        <NamedListManager
          items={types}
          onCreate={handleCreateType}
          onDelete={handleDeleteType}
          placeholder="New type, e.g. Board Game"
          readOnly={readOnly}
        />
      </section>

      <section className="card">
        <h2>Categories</h2>
        <NamedListManager
          items={categories}
          onCreate={handleCreateCategory}
          onDelete={handleDeleteCategory}
          placeholder="New category, e.g. Amiibo"
          readOnly={readOnly}
        />
      </section>

      {!readOnly && (
        <section className="card">
          <h2>Add item</h2>
          <ItemForm onSubmit={handleCreate} types={types} categories={categories} />
        </section>
      )}

      <section className="card">
        <div className="toolbar">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select value={wishlistFilter} onChange={(e) => setWishlistFilter(e.target.value)}>
            <option value="">Owned + wishlist</option>
            <option value="false">Owned only</option>
            <option value="true">Wishlist only</option>
          </select>
          <input
            placeholder="Search title / category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <ItemList
            items={items}
            types={types}
            categories={categories}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            readOnly={readOnly}
          />
        )}
      </section>
    </div>
  );
}