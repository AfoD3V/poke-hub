## Context

The Search tab today is a thin proxy: a single text input sends `?q=<name>` to `GET /api/cards/search`, which calls `https://api.tcgdex.net/v2/en/cards?name=<query>` and returns a paginated card list.

TCGdex also exposes a set-scoped single-card endpoint: `GET /v2/en/sets/{setId}/{localId}` (e.g., `/v2/en/sets/SVN/112`). This returns one card object with the same shape as items in the card list. The existing `mapUpstreamCard` mapper can handle it.

The change adds a second lookup mode without altering the existing name-search flow.

## Goals / Non-Goals

**Goals:**
- Let users pick "By Name" or "By Set & Number" in the Search tab.
- Add `GET /api/cards/by-set?setId=SVN&cardNumber=112` to the Hono backend.
- Display the single returned card in the existing card grid.
- Persist mode + set/number params in the URL for shareability.

**Non-Goals:**
- Autocomplete or validation of set codes (no set list dropdown in this change).
- Caching or database storage of lookup results.
- Pagination for the set-ID result (it is always a single card).
- Bulk lookup (e.g., multiple card numbers at once).

## Decisions

**1. Separate endpoint, not an overloaded `?q=`**

Option A: detect `SVN-112` pattern in the existing `?q=` param and branch internally.
Option B: dedicated `GET /api/cards/by-set` endpoint.

Chose **B**. Keeps the search service pure (name → list) vs. lookup service (set+id → single card). Avoids regex heuristics that would break if a Pokémon name resembles a set code. Easier to test independently.

**2. UI mode selector as a segmented control, not a dropdown**

Two modes only → a two-button segmented toggle fits the dark-mode design without the overhead of a `<select>`. Mode state lives in the component (not the server load); URL params are synced on search execution.

**3. Reuse `mapUpstreamCard` for the single-card response**

TCGdex returns the same card object shape from both the list and the set-scoped endpoints. No new mapper needed.

**4. SvelteKit proxy route mirrors the existing `/api/cards/search` pattern**

A new `ui/src/routes/api/cards/by-set/+server.ts` forwards params to the Hono backend. This keeps the UI decoupled from the backend URL and consistent with the existing proxy approach.

## Risks / Trade-offs

- **Invalid set or card number** → TCGdex returns 404. The backend should translate this to a user-friendly 404 with message `"Card not found"`. Risk: upstream 404 shape could change. Mitigation: check `response.ok` and always return our own error body.
- **Set codes are case-sensitive on TCGdex** → Pass the set ID as-is; document in the UI placeholder that codes are uppercase (e.g., `SVN`). Users entering lowercase get a 404, which surfaces as "Card not found" — acceptable for now.
- **Mode state reset on SSR load** → On a direct URL visit with `?mode=set&setId=SVN&cardNumber=112`, the server load function must perform the set lookup, not the name search. The server load needs to read `mode` from URL params and branch accordingly.
