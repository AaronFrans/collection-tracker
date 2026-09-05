import { getToken, clearToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export class UnauthorizedError extends Error {}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    clearToken();
    throw new UnauthorizedError("unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  checkPassword: async (password) => {
    const res = await fetch(`${API_URL}/api/auth/check`, {
      method: "POST",
      headers: { Authorization: `Bearer ${password}` },
    });
    return res.ok;
  },

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

  listTypes: () => request("/api/types"),
  createType: (name) => request("/api/types", { method: "POST", body: JSON.stringify({ name }) }),
  deleteType: (id) => request(`/api/types/${id}`, { method: "DELETE" }),
};
