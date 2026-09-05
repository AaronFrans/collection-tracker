const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listItems: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/items${query ? `?${query}` : ""}`);
  },
  createItem: (item) => request("/api/items", { method: "POST", body: JSON.stringify(item) }),
  updateItem: (id, item) => request(`/api/items/${id}`, { method: "PUT", body: JSON.stringify(item) }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: "DELETE" }),

  listCategories: () => request("/api/categories"),
  createCategory: (name) => request("/api/categories", { method: "POST", body: JSON.stringify({ name }) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),
};
