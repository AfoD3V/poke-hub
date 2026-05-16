## Why

Users identify Pokémon TCG cards by the abbreviation printed on the physical card (e.g., MEW, DAA, BRS) but our set/number lookup requires a TCGdex internal set ID (e.g., sv03.5, swsh3). There is no documented mapping between the two, making the feature unusable for anyone who doesn't know TCGdex internals. The fix is to replace the raw Set ID text input with a searchable combobox that lets users find a set by name, abbreviation, or TCGdex ID — the internal ID becomes an implementation detail the user never sees.

## What Changes

- **New backend endpoint** `GET /api/sets` — proxies to TCGdex and returns a lightweight, sorted list of all sets: `[{ id, name, abbreviation, cardCount, releaseDate }]`. Response is cached in-memory (TTL 24 h) so subsequent calls are instant. New sets appear automatically when the cache refreshes.
- **Set ID text input replaced with a combobox** in the Search tab's "By Set & Number" form. Users type any part of the set name, abbreviation, or ID; the dropdown filters client-side and shows `"Name (ABBR) — N cards"`. Selecting an entry auto-fills the internal TCGdex ID invisibly.
- **New SvelteKit proxy route** `GET /api/sets` forwarding to the Hono backend.
- **Graceful degradation** — if the sets list fails to load, the combobox falls back to a plain text input with a placeholder hint (`e.g. sv03.5`).

## Capabilities

### New Capabilities

- `set-list-endpoint`: Backend endpoint that returns all TCGdex sets with name, abbreviation, card count, and release date, with in-memory caching.
- `set-picker-combobox`: Frontend combobox component that searches sets by name, abbreviation, or ID and resolves the selection to the correct internal TCGdex set ID for the card lookup.

### Modified Capabilities

- `card-set-id-lookup`: The Set ID field in the "By Set & Number" form is now driven by the combobox instead of a free-text input. The lookup behaviour (calling `/api/cards/by-set`) is unchanged.

## Impact

- **Backend**: New route + service function + in-memory cache in `server/src/services/tcg-proxy.ts` and `server/src/routes/tcg-proxy.ts`.
- **Frontend**: New `SetPicker.svelte` combobox component in `ui/src/lib/components/`; updated `+page.svelte` search page; new SvelteKit proxy at `ui/src/routes/api/sets/+server.ts`.
- **Tests**: New Vitest tests for the backend sets endpoint (positive, cache hit, upstream error). Postman collection updated. Frontend component tests for filtering and selection.
- **No DB changes**, no auth changes, no breaking changes to existing endpoints.
