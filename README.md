# PokeHub

PokeHub is a premium personal collection manager for Pokemon TCG enthusiasts. It tracks Pokedex progress, manages multi-language collections, and will support market value insights.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime
- PostgreSQL database running locally (or via Docker)

### 1. Environment Setup

Copy and configure the environment variables for both backend and frontend:

```bash
# Backend
cp .env.example server/.env
# Update DATABASE_URL and JWT_SECRET in server/.env

# Frontend
cp ui/.env.example ui/.env
# Update API_BASE_URL and PUBLIC_ORIGIN in ui/.env if needed
```

### 2. Database Setup

Ensure PostgreSQL is running and the database exists. Then generate and apply migrations from the `server/` directory:

```bash
cd server
bun run db:generate
bun run db:migrate
```

### 3. Running the Backend

From the `server/` directory:

```bash
bun run dev
```

The API will start on the port defined by `PORT` in `server/.env` (default: `3000`).

### 4. Running the Frontend

Install dependencies and start the dev server from the `ui/` directory:

```bash
cd ui
bun install
bun run dev
```

The SvelteKit UI will start on `http://localhost:5173` by default.

### 5. Running Tests

- **Backend tests:**
  ```bash
  cd server
  bun test
  ```

- **Frontend tests:**
  ```bash
  cd ui
  bun run test
  ```

---

## Status

Phase 1: Core infrastructure and auth backend complete. SvelteKit auth UI scaffolded.

## Tech Stack

- Frontend: SvelteKit + Tailwind CSS (`ui/`)
- Backend: Bun + Hono (TypeScript) (`server/`)
- Database: PostgreSQL + Drizzle ORM
- Real-time: Postgres LISTEN/NOTIFY + WebSockets

## Project Docs

- Agent guidelines: `AGENTS.md`
- Specs and configs: `openspec/`
- Technical docs: `docs/`
- Postman collection: `docs/postman/pokehub.postman_collection.json`
