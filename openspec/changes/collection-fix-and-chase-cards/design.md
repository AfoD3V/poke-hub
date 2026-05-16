## Context

PokeHub runs SvelteKit on port 4000 (adapter-node) and Hono on port 3000 in Docker Compose. `CardModal.svelte` uses a client-side `fetch('/api/collection/add', ...)` that works in dev only because Vite's dev server proxy rewrites `/api/*` to `localhost:3000`. In production (Docker), the SvelteKit node server receives this request and returns an HTML 404. The fix is a SvelteKit `+server.ts` endpoint that proxies the call server-side. The chase-cards feature is a new end-to-end capability layered on top of the existing `cardsCache` and `userCollection` patterns.

## Goals / Non-Goals

**Goals:**
- Fix the JSON-parse error on "Add to Collection" in Docker without changing the client-side fetch URL
- Add richer home dashboard stats: per-set card counts and rarity distribution
- Introduce chase cards: mark/unmark any card as a chase target; view chase board on home page grouped by set/series

**Non-Goals:**
- Notifications or push alerts when a chased card price changes
- Bulk import/export of chase lists
- Public sharing of chase lists

## Decisions

### 1. SvelteKit proxy endpoint for collection add
**Decision:** Create `ui/src/routes/api/collection/add/+server.ts` that reads the `Authorization`/`Cookie` header from the incoming request and forwards it to `API_BASE_URL/api/collection/add`.

**Rationale:** The client already calls `/api/collection/add` — no client change needed. The server endpoint runs inside the SvelteKit process which has access to `API_BASE_URL` env var (set to `http://api:3000` in Docker). This mirrors how `+page.server.ts` already talks to Hono for reads.

**Alternative considered:** Nginx reverse-proxy `/api/*` to Hono at the Docker level. Rejected — adds infra complexity and a new container for what is a one-file fix.

### 2. Chase cards stored in a dedicated DB table
**Decision:** New `userChaseCards` table with `(id, userId, cardId, addedAt)`. Card payload is NOT duplicated — it is read from `cardsCache` on join (same pattern as collection).

**Rationale:** Keeps card data in one place (`cardsCache`). A chase entry is lightweight (just a pointer). Matches the existing `userCollection` schema pattern — easy to extend later (e.g. priority, notes).

**Alternative considered:** Storing chaseCards as a JSONB column on the `users` row. Rejected — no indexing, harder to query per-card.

### 3. Home dashboard stats computed server-side
**Decision:** `home/+page.server.ts` computes set counts and rarity breakdown from the collection entries returned by the existing `GET /api/collection` call. No new backend endpoint for stats.

**Rationale:** Collection entries already include full card payloads (via `cardsCache` JOIN in the collection service). Aggregating in the SvelteKit load function avoids a new round-trip and a new backend route.

### 4. Chase board grouped by set on home page
**Decision:** Chase section on home shows cards grouped by their set name. Each group shows the set logo (from `cardsCache` payload), set name, and a strip of card thumbnails. Clicking a card opens `CardModal`.

**Rationale:** Users shop by set/booster box — grouping by set tells them exactly which packs to buy. Series grouping is one level higher than needed for purchasing decisions.

## Risks / Trade-offs

- **Cookie forwarding complexity** → The SvelteKit proxy endpoint must forward the `cookie` header from the browser request to Hono verbatim; if the cookie name ever changes, auth breaks silently. Mitigation: read `event.request.headers.get('cookie')` and pass it through.
- **cardsCache miss for chased cards** → If a card was never fetched (not in cache), the chase list JOIN returns null payload. Mitigation: store a minimal card snapshot (`name`, `setName`, `images`) in the chase table as a JSONB `cardSnapshot` column so the UI always has enough to render.
- **Migration in Docker** → New table requires generating a migration (`bun run db:generate` in `server/`) and rebuilding the migrate service. Mitigation: document the step in tasks.md.

## Migration Plan

1. Add `userChaseCards` table to `server/src/db/schema.ts`
2. Run `bun run db:generate` in `server/` → creates new migration file
3. `docker compose up -d --build` — the `migrate` service applies the migration automatically on startup
4. Rollback: drop the `userChaseCards` table; no existing data is affected
