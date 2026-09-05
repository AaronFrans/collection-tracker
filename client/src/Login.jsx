import { useState } from "react";
import { api } from "./api";
import { setToken } from "./auth";

export function Login({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    try {
      const ok = await api.checkPassword(password);
      if (!ok) {
        setError("Wrong password.");
        return;
      }
      setToken(password);
      onSuccess();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Collection Tracker</h1>
        <label>
          Password
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={checking}>
          {checking ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}