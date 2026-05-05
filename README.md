# PokeHub

PokeHub is a premium personal collection manager for Pokemon TCG enthusiasts. It tracks Pokedex progress, manages multi-language collections, and will support market value insights.

## Status

Phase 1: Core infrastructure and auth backend complete. SvelteKit auth UI scaffolded.

## Tech Stack

- Frontend: SvelteKit + Tailwind CSS (`ui/`)
- Backend: Bun + Hono (TypeScript) (`server/`)
- Database: PostgreSQL + Drizzle ORM
- Real-time: Postgres LISTEN/NOTIFY + WebSockets

## Local Development

### Backend

- Scaffold lives in `server/` (Bun + Hono).
- Copy `.env.example` to `server/.env` and update `DATABASE_URL` and `JWT_SECRET`.
- Run `bun run db:generate && bun run db:migrate` from `server/` to apply migrations.
- Start with `bun run dev` from `server/`.

### Frontend

- Scaffold lives in `ui/` (SvelteKit + Tailwind).
- Copy `ui/.env.example` to `ui/.env`.
- Install dependencies: `npm install` from `ui/`.
- Start with `npm run dev` from `ui/`.
- Run component tests with `npm test` from `ui/`.

## Project Docs

- Agent guidelines: `AGENTS.md`
- Specs and configs: `openspec/`
- Technical docs: `docs/`
- Postman collection: `docs/postman/pokehub.postman_collection.json`
