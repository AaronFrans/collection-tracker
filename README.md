# Collection Tracker

A small vibe coded personal tracker for games and collectibles you own, accessible from anywhere.

- `server/` — Express API, backed by [Turso](https://turso.tech) (hosted SQLite-compatible DB via `@libsql/client`).
- `client/` — React (Vite) frontend: add/edit/delete items, filter by type/category, search.
- `docs/` — GitHub Pages redirect to the deployed client, for a shorter URL.

## Data model

- `items`: `type` (from a user-managed list), `title`, `category` (also user-managed, optional), `purchase_price`,
  `notes`, timestamps.
- `types` / `categories`: freely add/rename/delete your own — e.g. types like "Game", "Board Game", "Comic";
  categories like "Amiibo", "Switch", "Sealed".

## Access

- **Viewing** the tracker needs no password — anyone with the link can browse.
- **Adding, editing, or deleting** anything (items, types, categories) requires the `APP_PASSWORD` set on the server.

## Local development

### 1. Create a free Turso database

```
turso db create collection-tracker
turso db show collection-tracker --url
turso db tokens create collection-tracker
```

(Install the CLI first: see https://docs.turso.tech/cli/installation — no Windows build, use the web dashboard at
https://turso.tech instead if you're on Windows.)

### 2. Server



```
cd server
cp .env.example .env   # fill in TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, APP_PASSWORD
npm install
npm run dev             # http://localhost:3001
```

The database schema is created/migrated automatically on startup.

### 3. Client

```
cd client
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:3001
npm install
npm run dev             # http://localhost:5173
```

## Hosting

- **Database**: [Turso](https://turso.tech)
- **API + client**: [Render](https://render.com)
- **Short URL**: GitHub Pages, serving `docs/` — redirects to the deployed client so you don't have to remember/share
  the full `onrender.com` URL.