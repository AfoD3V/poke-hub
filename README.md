# PokeHub

PokeHub is a premium personal collection manager for Pokemon TCG enthusiasts. It tracks Pokedex progress, manages multi-language collections, and will support market value insights.

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/)

### Quick Start

```bash
# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD and JWT_SECRET

# 2. Build images and start all services
docker compose up -d --build

# 3. Open the app
open http://localhost:4000
```

Services when running:

| Service | URL |
|---------|-----|
| UI (Next.js) | http://localhost:4000 |
| API (Hono) | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

Migrations run automatically on every `docker compose up`.

### Running Tests

```bash
# Backend (from server/)
bun run test

# Frontend (from ui/)
bun run test

# Type checking (from ui/)
npm run check

# Lint (from repo root)
bun run lint
```

> **Note:** Always use `bun run test`, not `bun test` — the latter bypasses the Vitest + jsdom config.

---

## Status

Phase 1 Tasks 1–4 complete (infrastructure, auth, TCG search, collection management). Next: Phase 1 Task 5 — Real-Time Event Architecture.

## Tech Stack

- Frontend: Next.js 14 App Router (React 18) + Tailwind CSS (`ui/`)
- Backend: Bun + Hono (TypeScript) (`server/`)
- Database: PostgreSQL + Drizzle ORM
- Real-time: Postgres LISTEN/NOTIFY + WebSockets (Phase 1 Task 5)
- Deployment: k3s + Helm + Traefik

## Project Docs

- Agent guidelines: `AGENTS.md`
- Specs and configs: `openspec/`
- Technical docs: `docs/`
- Postman collection: `docs/postman/pokehub.postman_collection.json`
