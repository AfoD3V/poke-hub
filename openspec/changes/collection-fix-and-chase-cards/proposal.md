## Why

The "Add to Collection" button silently fails in Docker (production) because `CardModal.svelte` calls `/api/collection/add` client-side — the Vite dev proxy handles this in dev mode, but SvelteKit adapter-node has no such proxy, so the request hits the SvelteKit server and receives an HTML 404 instead of JSON. Additionally, users need a way to track cards they're hunting for (chase cards) and see richer home dashboard stats about their existing collection.

## What Changes

- **Fix** client-side `/api/collection/add` fetch by introducing a SvelteKit server endpoint that proxies to the Hono backend (preserving auth cookie forwarding)
- **Enhance** home dashboard with per-set card counts and rarity breakdown
- **Add** chase card system: users can mark any card as a chase target; home dashboard shows a chase board grouped by series/set

## Capabilities

### New Capabilities

- `collection-add-proxy`: SvelteKit server endpoint (`POST /api/collection/add`) that forwards requests to Hono with auth cookie — fixes the Docker JSON error
- `chase-cards`: Full chase card system — DB table, backend CRUD routes, CardModal toggle, and home dashboard chase board

### Modified Capabilities

- `home-dashboard`: Add per-set collection breakdown and rarity distribution stats; add chase board section showing targeted cards grouped by set

## Impact

- **Schema**: New `userChaseCards` table → new Drizzle migration required
- **Backend**: New `/api/chase/*` routes (GET, POST, DELETE) in `server/src/routes/chase.ts`; registered in `server/src/app.ts`
- **Frontend**: New `ui/src/routes/api/collection/add/+server.ts`; updates to `CardModal.svelte`, `home/+page.server.ts`, `home/+page.svelte`
- **No breaking changes** to existing collection API or auth flow
