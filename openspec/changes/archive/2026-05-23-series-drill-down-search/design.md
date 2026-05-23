## Context

The search page currently has two modes: name search (GraphQL, English only) and set-number lookup (free-text Set ID via SetPicker). The codebase follows a clear layering: TCGdex API calls in `server/src/services/tcg-proxy.ts`, Hono routes in `server/src/routes/tcg-proxy.ts`, SvelteKit proxy routes under `ui/src/routes/api/`, and page components under `ui/src/routes/(app)/search/`. A 24h in-memory cache already exists for the sets list; the same pattern extends cleanly to series and set-cards.

TCGdex API facts relevant to this design (verified against live API):
- `GET /v2/en/series` — returns list of 21 series, each with `id`, `name`, optional `logo`. **No `releaseDate`**.
- `GET /v2/en/series/:id` — returns series detail including `releaseDate`, `logo`, and embedded `sets[]` (with `id`, `name`, optional `logo`, `cardCount`).
- `GET /v2/en/sets/:id` — returns set detail including `cards[]` (id, name, localId, image).
- Language prefix is swappable: `/v2/ja/...`, `/v2/fr/...`, etc. TCGdex supports at least: `en`, `fr`, `de`, `es`, `it`, `pt`, `ja`.

## Goals / Non-Goals

**Goals:**
- Three-column animated browse: series → sets → cards, with breadcrumb back navigation.
- Series sorted by `releaseDate` descending (requires parallel detail fetches for all 21 series on cache miss).
- Language selector on the By Name tab routes the GraphQL name search to the correct TCGdex language endpoint.
- 24h cached backend endpoints for series list and set cards.
- Column 1 rendered on SSR (series pre-fetched server-side); Columns 2 and 3 loaded client-side on demand.
- Graceful degradation: if series fetch fails, show empty state with retry; name search always available.

**Non-Goals:**
- Infinite scroll or virtualisation within a column (40-card pagination is sufficient; sets are max ~250 cards).
- Persisting the selected series/set across page navigation (URL params for shareable deep links are out of scope).
- Adding language support to the series/set browse path (always English — TCGdex set logos are language-neutral).
- Displaying card details inline in Column 3 (clicking opens the existing CardModal).

## Decisions

**1. Parallel detail fetches for series `releaseDate` on cache miss**

The series list endpoint omits `releaseDate`. To sort by newest-first we need it. With only 21 series, fetching all detail pages in parallel on cache miss (~200 ms per request, 21 concurrent) is fast and safe. The 24h cache means this cost is paid once per server process. Returning the merged result: `{ id, name, logo, releaseDate }[]` sorted descending.

Alternative (sort alphabetically from list endpoint): rejected — chronological order is the most useful for collectors who think "newest first".

**2. Series detail embeds sets; no separate `/api/series/:id/sets` endpoint**

`GET /api/series/:id` returns the full `SeriesDetail` including the embedded sets array. The client needs both series metadata and its sets when drilling into Column 2. One request is better than two.

Alternative (separate `/api/series/:id/sets`): rejected — unnecessary round-trip; the TCGdex series detail already bundles sets.

**3. Set cards loaded client-side on demand, not SSR**

Column 3 (cards) is triggered by user interaction deep in the drill-down. Pre-fetching on SSR would mean loading up to 250 cards for a path the user may never take. Instead, `GET /api/sets/:id/cards` is called client-side when the user selects a set.

Alternative (SSR all): rejected — page load time would become unacceptable for the common case.

**4. Three-column slide implemented with CSS transform + Svelte transitions**

The column layout is a fixed three-slot flex container. When the active column index changes, a CSS `translateX` transition slides all columns simultaneously. Svelte's reactive `$:` declarations compute the `translateX` offset based on `activeColumn` (0, 1, or 2). No external animation library needed.

Alternative (separate routes per level): rejected — routing adds complexity and breaks the animated-panel UX; this is a client-side drill-down, not page navigation.

**5. Language selector state is local to the search page (not persisted)**

The selected language defaults to English and resets on full page navigation. It does not go into the URL or localStorage. This keeps implementation minimal; users can change language before each search.

Alternative (URL param `?lang=ja`): accepted as future enhancement but out of scope now.

**6. `GET /api/series` returns pre-sorted merged list (name + releaseDate + logo)**

The service layer fetches the list endpoint (for ids/names), then fan-outs to all 21 detail endpoints in parallel to collect `releaseDate` and best-available `logo`. The route returns this merged, sorted array. The client never sees intermediate state.

Alternative (client-side fetch of individual series details): rejected — wastes browser connections; server can fan-out faster and cache the result.

## Risks / Trade-offs

- **21 parallel detail fetches on cache miss** → ~300–500 ms cold start. Mitigation: warm cache on first request after server start; the 24h TTL means this is extremely rare in production.
- **TCGdex series logo availability** → Some series (e.g. "Miscellaneous") have no logo. Mitigation: show a placeholder tile with the series name; CSS ensures graceful fallback.
- **SetPicker removal breaks the existing By Set & Number flow** → Users who bookmarked `?mode=set&setId=...` will land on the series browser. Mitigation: if URL has legacy `setId` + `cardNumber` params on load, execute a one-time card lookup and show the result before the browser UI. This keeps deep links functional.
- **TCGdex language endpoints vary in completeness** → Japanese sets predate the English TCG; some cards may have no English name. Mitigation: display raw TCGdex name regardless; no translation layer.
- **Large card grids (up to 250 cards) in Column 3** → Render performance on low-end devices. Mitigation: paginate at 40 cards per page with "Load more".
