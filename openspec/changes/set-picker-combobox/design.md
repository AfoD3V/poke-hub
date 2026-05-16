## Context

The existing "By Set & Number" form has a free-text Set ID input. Users must know the TCGdex internal set ID (e.g. `sv03.5`) to use it — but physical cards print a different abbreviation (`MEW`). TCGdex exposes abbreviations only on individual set detail endpoints, not the list endpoint. A single GraphQL query can fetch all sets with their abbreviations in one round-trip (same pattern already used by `searchCards`).

The sets list is small (~300 items, ~30 KB JSON) and changes infrequently (a few times per year when new sets release). In-memory caching with a 24-hour TTL is the right trade-off: zero infrastructure overhead, stale data for at most one day, new sets appear automatically.

## Goals / Non-Goals

**Goals:**
- Users can find a set by typing its name, abbreviation, or TCGdex ID.
- The internal TCGdex set ID is never exposed to the user.
- New sets appear automatically within 24 hours of TCGdex adding them.
- Fallback to plain text input if the sets list fails to load.

**Non-Goals:**
- Server-side search or autocomplete (filtering happens client-side; the list is small enough).
- Persisting the sets list to the database or Redis.
- Displaying set logos or symbols in the combobox (keep it fast and lightweight).
- Pagination of the sets list.

## Decisions

**1. GraphQL to fetch sets with abbreviations (one request)**

The REST list endpoint (`GET /v2/en/sets`) omits `abbreviation`. Fetching each of ~300 sets individually is an N+1 problem. TCGdex GraphQL allows querying all sets with their abbreviation in one `POST`. This mirrors the existing `searchCards` implementation.

Query shape:
```graphql
query {
  sets {
    id
    name
    abbreviation { official }
    releaseDate
    cardCount { official }
  }
}
```

Alternative (REST + individual fetches): rejected — 300 HTTP requests per cache miss is unacceptable.

**2. In-memory cache with 24 h TTL (module-level singleton)**

A module-level `{ data, expiresAt }` object in `tcg-proxy.ts` holds the sets list. On each `GET /api/sets` request:
- If cache is valid → return immediately (no upstream call).
- If stale or empty → fetch from GraphQL, update cache, return.

Alternative (Redis): rejected — Redis is available but this data doesn't need cross-process sharing or persistence. A process restart (rare in Docker Compose) just clears the cache, which is fine.

**3. Client-side filtering in the combobox**

All ~300 sets are fetched once when the user first opens the "By Set & Number" tab and stored in component state. Filtering is a simple `Array.filter` on name, abbreviation, and id — fast enough that debouncing is not needed.

Alternative (server-side search endpoint): rejected — unnecessary round-trip per keystroke for a ~300-item list.

**4. `SetPicker.svelte` as a standalone combobox component**

Encapsulates: input field, dropdown list, keyboard navigation (↑↓ Enter Escape), and the selected-ID-vs-display-label split. Emits a `select` event with `{ id: string, label: string }`. The search page listens and writes `id` into its `setId` state variable — the same variable already wired to the card lookup.

Svelte 4 patterns (consistent with the rest of the codebase): `export let`, `on:select`, `createEventDispatcher`.

**5. Fallback to plain text input**

If `GET /api/sets` fails or returns an empty list, `SetPicker` shows a standard `<input>` with placeholder `"Set ID (e.g. sv03.5)"`. Users lose autocomplete but the lookup still works if they know the ID.

## Risks / Trade-offs

- **Stale set data for up to 24 h** → New sets won't appear in the combobox until the cache expires. Acceptable: new sets release a few times per year and are not immediately collectible.
- **Process-restart clears cache** → First request after a restart triggers a GraphQL call (~200–500 ms). Not user-facing for most restarts (Docker health checks absorb it). Mitigation: none needed.
- **TCGdex GraphQL `sets` query shape unverified** → Confirmed from the REST detail endpoint that `abbreviation.official` exists. The GraphQL field shape should match but must be validated in the first test task before any implementation begins (TDD).
- **Combobox a11y** → Must implement `role="combobox"`, `aria-expanded`, `aria-activedescendant`, and keyboard navigation to meet WCAG 2.1 AA. This is non-trivial but well-defined.
