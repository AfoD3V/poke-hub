## Why

The current Search tab only supports name-based queries, which forces users to know a card's exact name. Collectors typically identify cards by their set code and card number (e.g., "SVN 112"), so there is no way to look up a specific card from a binder or booster pack without guessing the name. Adding set-ID + local-ID search unlocks a precise, collector-native lookup flow.

## What Changes

- **New search mode selector** in the Search tab: users choose between "By Name" (existing) and "By Set & Number" (new).
- **New backend endpoint** `GET /api/cards/by-set` that accepts `setId` and `cardNumber` params and proxies to the TCGdex `/v2/en/sets/{setId}/{cardNumber}` endpoint, returning a single `TcgCard`.
- **New SvelteKit proxy route** `GET /api/cards/by-set` that forwards the request to the Hono backend.
- **Search UI updated** to render a two-field form (Set ID + Card Number) when "By Set & Number" mode is active, replacing the single text input.
- **URL state** updated to persist `mode`, `setId`, and `cardNumber` params for shareability.

## Capabilities

### New Capabilities

- `card-set-id-lookup`: Look up a single card by TCGdex set code (e.g., `SVN`) and local card number (e.g., `112`), returning a single card result displayed in the existing card grid.

### Modified Capabilities

- `card-name-search`: Search tab gains a mode selector; "By Name" behaviour is unchanged but the UI wraps it in a selectable mode. No spec-level requirement changes to the search result contract.

## Impact

- **Backend**: New route + service function in `server/src/routes/tcg-proxy.ts` and `server/src/services/tcg-proxy.ts`.
- **Frontend**: `ui/src/routes/(app)/search/+page.svelte` and `+page.server.ts` updated; new SvelteKit proxy at `ui/src/routes/api/cards/by-set/+server.ts`.
- **Shared types**: No new types needed — existing `TcgCard` covers single-card responses.
- **No DB changes**, no auth changes, no breaking API surface changes.
- **Tests**: New Vitest tests for the backend endpoint (positive + negative). Existing search tests unaffected.
- **Postman**: New request added to the collection.
