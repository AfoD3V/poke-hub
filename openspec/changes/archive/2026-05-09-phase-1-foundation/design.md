## Context

Phase 1 establishes the core backend, database, and auth foundations for PokeHub, then layers on the search UI, collection management, realtime toasts, and deployment. The system must follow the existing stack (Bun + Hono, Postgres, Drizzle, SvelteKit, Tailwind) and enforce a zero-trust backend posture with authenticated routes by default.

## Goals / Non-Goals

**Goals:**
- Provide a stable backend scaffold with health checks and verified DB connectivity.
- Define initial data models for users, cards cache, and user collections using Drizzle.
- Implement secure auth (HttpOnly cookie sessions or equivalent) with protected endpoints.
- Deliver a search UI with secure proxy access to pokemontcg.io and holographic card effects.
- Enable basic collection CRUD with immediate UI feedback via realtime events.
- Provide deployment-ready artifacts for k3s (Dockerfiles, Helm chart, Traefik ingress).

**Non-Goals:**
- Full market value tracking, pricing intelligence, or recommendation engines.
- Advanced collection analytics or trading workflows.
- Production-grade observability beyond basic health checks.

## Decisions

- Backend framework is Bun + Hono with services extracted from route handlers to align with the security and maintainability directives. Alternative: Express or Fastify; rejected to avoid deviation from stack.
- Use Drizzle ORM exclusively for all database interactions; raw SQL is forbidden. Alternative: Prisma; rejected per stack and migration policy.
- Authentication uses HttpOnly cookies (session or JWT) with middleware-enforced protection on non-public routes. Alternative: token in localStorage; rejected for XSS exposure and policy violations.
- TCG API access is proxied through Hono to keep API keys server-side. Alternative: direct client calls; rejected by security policy.
- Realtime updates leverage Postgres LISTEN/NOTIFY plus WebSockets, keeping the server as the broadcast point. Alternative: polling; rejected to satisfy realtime validation requirements.
- UI uses SvelteKit + Tailwind with pokemon-cards-css integration for holographic effects. Alternative: custom CSS effects; rejected to follow mandated library usage.

## Risks / Trade-offs

- [Auth implementation complexity] → Mitigation: choose a single auth approach and enforce middleware in a shared Hono layer.
- [Schema evolution early on] → Mitigation: create new migrations for changes; never edit applied migrations.
- [Realtime reliability] → Mitigation: add reconnection handling on the client and fall back to manual refresh UX copy.
- [External API latency or outages] → Mitigation: cache responses in cards_cache and handle error UI states.
- [Deployment drift between local and k3s] → Mitigation: keep Dockerfile and Helm values minimal with documented defaults.
