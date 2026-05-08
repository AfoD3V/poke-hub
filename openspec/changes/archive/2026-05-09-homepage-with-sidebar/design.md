## Context

PokeHub currently has Search and Collection pages, each with a hard-coded inline top-navbar. There is no shared layout for authenticated views and no landing page — after login the user is immediately redirected to `/search`. Adding a sidebar and home dashboard requires introducing an authenticated layout shell without breaking the existing auth-bypass pattern for the `/auth/*` routes.

## Goals / Non-Goals

**Goals:**
- Single `Sidebar.svelte` component used by all authenticated pages (Search, Collection, Home)
- `/home` route as the post-login dashboard with collection summary stats and quick-action links
- Root redirect sends authenticated users to `/home`; unauthenticated users to `/auth/login`
- Remove duplicate inline navbars from Search and Collection pages
- Sidebar is accessible: keyboard-navigable, ARIA landmarks, active-link highlighting

**Non-Goals:**
- Mobile drawer / hamburger menu (sidebar is always visible for now)
- Real-time stat updates (dashboard stats are fetched once on load via SSR)
- New backend endpoints (all data comes from existing `/api/cards/collection` endpoint)
- User profile page or avatar upload

## Decisions

### 1. Layout nesting: authenticated shell vs auth shell
SvelteKit supports nested layouts. The current root `+layout.svelte` is minimal (just imports `app.css`). We will keep this as-is and introduce a new `(app)/+layout.svelte` route group that wraps the authenticated pages (Home, Search, Collection) with the sidebar shell.

`/auth/*` routes remain outside the `(app)` group and get their own minimal layout — they should not show the sidebar.

**Why route groups over a single layout?** SvelteKit route groups (parentheses-prefixed directories) let us share layout without adding a URL segment. This avoids forcing every page to opt-out of the sidebar and keeps auth pages completely isolated.

### 2. Sidebar component: Svelte component, not layout template
`Sidebar.svelte` is a standalone component imported by `(app)/+layout.svelte`. It receives no props (uses SvelteKit's `$page` store for active-link detection).

**Why standalone component?** Easier to test in isolation and reuse if we ever add a mobile nav variant.

### 3. Home dashboard stats: SSR load from existing endpoint
`/home/+page.server.ts` calls the existing `/api/cards/collection` endpoint (forwarding the session cookie) and derives stats (total cards, unique Pokémon count) server-side before render.

**Why not a dedicated stats endpoint?** No backend changes are needed for Phase 1. We can introduce an optimised `/api/stats` endpoint later without changing the frontend contract.

### 4. Active link detection
Use SvelteKit's `$page.url.pathname` in `Sidebar.svelte` to apply an active class. No custom store needed.

## Risks / Trade-offs

- **Route group migration** — Moving Search and Collection under `(app)/` changes file paths. Any hardcoded test imports of `+page.svelte` must be updated. → Mitigation: update test imports as part of the same task.
- **Duplicate navbar removal** — Removing inline navbars from Search and Collection is a pure deletion; no new functionality is lost. → Low risk; covered by Playwright visual verification.
- **SSR stat fetch latency** — Home page makes an extra backend call on load. If the collection endpoint is slow it blocks the dashboard render. → Acceptable for Phase 1; mitigate later with streaming/deferred loads.

## Migration Plan

1. Create `(app)` route group with layout + Sidebar component
2. Move `search/` and `collection/` directories under `(app)/`
3. Add `(app)/home/` route
4. Update root `+page.server.ts` redirect from `/search` → `/home`
5. Strip inline navbars from Search and Collection pages
6. Run `bun run check` + `bun run test` in `ui/`
7. Playwright visual snapshot of Sidebar, Home, Search, Collection

Rollback: revert the route group restructure; the inline navbars are preserved in git history.

## Open Questions

- Should the sidebar show the logged-in username? (Nice-to-have; can be added without design changes once a `/api/me` endpoint exists)
- Exact stat cards for the home dashboard (total cards and unique Pokémon are confirmed; anything else?)
