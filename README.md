# Collection Tracker

A small vibe coded personal tracker for games and collectibles you own, accessible from anywhere.

- `server/` — Express API, backed by [Turso](https://turso.tech) (hosted SQLite-compatible DB via `@libsql/client`).
- `client/` — React (Vite) frontend: add/edit/delete items, filter by type, search.

## Data model

Single `items` table: `type` (`game` | `collectible`), `title`, `platform` (games) or `category` (collectibles),
`condition`, `purchase_price`, `notes`, timestamps.

## Local development

### 1. Create a free Turso database

```
turso db create collection-tracker
turso db show collection-tracker --url
turso db tokens create collection-tracker
```

(Install the CLI first: see https://docs.turso.tech/cli/installation)

### 2. Server

```
cd server
cp .env.example .env   # fill in TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
npm install
npm run dev             # http://localhost:3001
```

The `items` table is created automatically on startup if it doesn't exist.

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