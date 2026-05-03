## Why

Phase 1 needs a clear, staged foundation so the core backend, database, and auth systems are aligned with the PokeHub product requirements before UI and real-time features are built. Establishing the base now reduces rework and de-risks later tasks that depend on secure data access and reliable infrastructure.

## What Changes

- Define the Phase 1 scope as a sequence of six deliverable tasks with explicit validations.
- Establish the core backend stack (Bun + Hono), Postgres database, and Drizzle ORM with initial schemas for users, cards_cache, and user_collection.
- Add authentication and protected routes as a first-class requirement, including SvelteKit auth pages.
- Introduce a secure TCG API proxy and a SvelteKit holographic search UI using pokemon-cards-css.
- Implement collection management endpoints and the My Collection dashboard.
- Add real-time event architecture (LISTEN/NOTIFY + WebSockets) for UI toasts.
- Define deployment artifacts (Dockerfiles, Helm umbrella chart, Traefik ingress) for k3s.

## Capabilities

### New Capabilities
- `core-infrastructure`: Backend scaffold, database setup, and initial schema with health checks.
- `auth-system`: User registration, login, session validation, and protected routes.
- `tcg-api-proxy`: Secure proxy to pokemontcg.io with API key isolation.
- `holographic-search-ui`: SvelteKit search UI integrating pokemon-cards-css card effects.
- `collection-management`: Add/remove collection endpoints and My Collection dashboard.
- `realtime-events`: Postgres LISTEN/NOTIFY + WebSocket broadcast and UI toasts.
- `k3s-deployment`: Dockerfiles, Helm chart, and Traefik ingress for k3s.

### Modified Capabilities
- (none)

## Impact

- Backend: new Hono services, auth middleware, WebSocket server, and API routes.
- Database: initial Drizzle schema and migrations for user and collection tables.
- Frontend: new SvelteKit auth, search, and collection pages plus realtime toast UI.
- External dependency: pokemontcg.io API via backend proxy; requires secure API key handling.
- Deployment: Docker build artifacts and Helm chart definitions for local and production clusters.
