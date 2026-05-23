## 1. Write Failing Tests (TDD — Red Phase)

- [x] 1.1 Write failing Vitest tests for `getSeries()` service: successful fetch returns array sorted by releaseDate descending (dated first, then alphabetical undated); upstream 502 throws `TcgProxyServiceError`; second call within TTL makes only one upstream request
- [x] 1.2 Write failing Vitest tests for `getSeriesById()` service: returns series detail with sets array on valid id; throws `TcgProxyServiceError(404)` on unknown id; cache hit makes only one upstream request
- [x] 1.3 Write failing Vitest tests for `getSetCards()` service: returns card array ordered by localId; throws 404 on unknown set; cache hit; upstream 502 propagates
- [x] 1.4 Write failing Vitest tests for `GET /api/series` route: 200 with sorted array, 502 on upstream failure, cache hit
- [x] 1.5 Write failing Vitest tests for `GET /api/series/:id` route: 200 with sets array, 404 on unknown id, 502 on upstream failure
- [x] 1.6 Write failing Vitest tests for `GET /api/sets/:id/cards` route: 200 with card array, 404, 502
- [x] 1.7 Write failing Vitest tests for `GET /api/cards/search` with `lang` param: valid lang routes to correct endpoint; missing lang defaults to `en`; invalid lang returns 400
- [x] 1.8 Write failing Vitest UI tests for `SeriesBrowser.svelte`: Column 1 renders series tiles; selecting a series triggers Column 2; selecting a set triggers Column 3; breadcrumb shows correct path; clicking breadcrumb segment resets to that column; loading and error states render correctly
- [x] 1.9 Run all new tests and confirm they fail (red)

## 2. Shared Types

- [x] 2.1 Add `SeriesItem` type to `shared/tcg.ts`: `{ id, name, logo, releaseDate }`
- [x] 2.2 Add `SeriesDetail` type to `shared/tcg.ts`: `{ id, name, logo, releaseDate, sets: SeriesSetItem[] }`
- [x] 2.3 Add `SeriesSetItem` type to `shared/tcg.ts`: `{ id, name, logo, cardCount }`
- [x] 2.4 Add `SetCardItem` type to `shared/tcg.ts`: `{ id, name, localId, image }`

## 3. Backend — Series & Set Cards Service

- [x] 3.1 Add module-level cache objects for series list, individual series details (keyed by id), and set cards (keyed by set id) to `server/src/services/tcg-proxy.ts`; export `_resetSeriesCache()` and `_resetSetCardsCache()` for tests
- [x] 3.2 Add TCGdex REST endpoints as constants: `UPSTREAM_SERIES_LIST`, `UPSTREAM_SERIES_DETAIL(id)`, `UPSTREAM_SET_DETAIL(id)` — no interpolation of user input
- [x] 3.3 Implement `getSeries()`: fetch series list, fan-out to all series detail endpoints in parallel to collect `releaseDate` and `logo`, merge, sort (dated newest-first then alphabetical), cache 24h, return `SeriesItem[]`
- [x] 3.4 Implement `getSeriesById(id)`: fetch series detail, map to `SeriesDetail` with embedded `SeriesSetItem[]`, cache per-id 24h, throw `TcgProxyServiceError(404)` if upstream returns 404
- [x] 3.5 Implement `getSetCards(setId)`: fetch set detail, extract `cards[]`, map to `SetCardItem[]` sorted by `localId`, cache per-setId 24h, throw `TcgProxyServiceError(404)` if not found
- [x] 3.6 Run service tests — confirm they pass (green)

## 4. Backend — Language-Aware Search

- [x] 4.1 Define `SUPPORTED_LANGS` constant (set of valid language codes: `en`, `ja`, `fr`, `de`, `es`, `it`, `pt`) in `tcg-proxy.ts`
- [x] 4.2 Update `searchCards(query, lang?)`: accept optional `lang` param, validate against `SUPPORTED_LANGS` (throw `TcgProxyServiceError(400, "Unsupported language: {lang}")` on invalid), use `https://api.tcgdex.net/v2/{lang}/graphql` as the endpoint, default to `en`
- [x] 4.3 Run updated `searchCards` tests — confirm they pass (green)

## 5. Backend — Routes

- [x] 5.1 Add `GET /api/series` route handler to `server/src/routes/tcg-proxy.ts`: call `getSeries()`, return 200 JSON array, map `TcgProxyServiceError` to its status code
- [x] 5.2 Add `GET /api/series/:id` route handler: call `getSeriesById(id)`, return 200 JSON object, 404 on not-found, 502 on upstream failure
- [x] 5.3 Add `GET /api/sets/:id/cards` route handler: call `getSetCards(id)`, return 200 JSON array, 404 on not-found, 502 on upstream failure
- [x] 5.4 Update `GET /api/cards/search` handler: read `lang` query param, pass to `searchCards()`, return 400 if service throws a 400-status error
- [x] 5.5 Run route tests — confirm they pass (green)

## 6. Backend — Postman

- [x] 6.1 Add "Series - List (Positive)" request: `GET {{baseUrl}}/api/series`; assert 200, non-empty array, first item has `id`, `name`, `releaseDate`
- [x] 6.2 Add "Series - Detail (Positive)" request: `GET {{baseUrl}}/api/series/sv`; assert 200, `sets` array non-empty
- [x] 6.3 Add "Series - Detail (Not Found)" request: `GET {{baseUrl}}/api/series/nonexistent`; assert 404
- [x] 6.4 Add "Set Cards - List (Positive)" request: `GET {{baseUrl}}/api/sets/sv03.5/cards`; assert 200, non-empty array with `id`, `name`, `localId`, `image`
- [x] 6.5 Add "Cards - Search (Japanese)" request: `GET {{baseUrl}}/api/cards/search?q=ピカチュウ&lang=ja`; assert 200, cards array
- [x] 6.6 Add "Cards - Search (Invalid Lang)" request: `GET {{baseUrl}}/api/cards/search?q=Pikachu&lang=zz`; assert 400

## 7. Frontend — SvelteKit Proxy Routes

- [x] 7.1 Create `ui/src/routes/api/series/+server.ts`: `GET` handler forwarding to `${API_BASE}/api/series`
- [x] 7.2 Create `ui/src/routes/api/series/[id]/+server.ts`: `GET` handler forwarding to `${API_BASE}/api/series/{id}`
- [x] 7.3 Create `ui/src/routes/api/sets/[id]/cards/+server.ts`: `GET` handler forwarding to `${API_BASE}/api/sets/{id}/cards`

## 8. Frontend — SeriesBrowser Component

- [x] 8.1 Create `ui/src/lib/components/SeriesBrowser.svelte` with props `series: SeriesItem[]`; scaffold three-column flex layout with `activeColumn` state (0 = series, 1 = sets, 2 = cards)
- [x] 8.2 Implement Column 1: render `series` prop as a CSS grid of logo tiles (`<img>` + name); show named placeholder div when `logo` is empty; on tile click set `selectedSeries` and fetch `/api/series/{id}`, set `activeColumn = 1`
- [x] 8.3 Implement column slide animation: use CSS `transform: translateX(...)` driven by `activeColumn`; Column 1 transitions from 100% → 30% width, Column 2 enters at 70%; all transitions use `transition: transform 300ms ease`
- [x] 8.4 Implement Column 2: render sets from `selectedSeriesDetail.sets` as logo tiles; on tile click set `selectedSet` and fetch `/api/sets/{id}/cards`, set `activeColumn = 2`
- [x] 8.5 Implement Column 3: render first 40 `SetCardItem[]` as `<Card>` components; "Load more" appends next 40; on card click open `CardModal`
- [x] 8.6 Implement breadcrumb: reactive computed string from `selectedSeries` and `selectedSet`; each segment is a button that resets `activeColumn` and clears deeper state
- [x] 8.7 Implement loading skeletons: while fetching series detail (Column 2 loading) or set cards (Column 3 loading) show `animate-pulse` placeholder tiles
- [x] 8.8 Implement error state: if Column 2 or Column 3 fetch fails, show error message with retry button
- [x] 8.9 Run UI component tests — confirm they pass (green)

## 9. Frontend — Language Selector Component

- [x] 9.1 Create `ui/src/lib/components/LanguageSelector.svelte`: `export let value = 'en'`; renders a `<select>` with options for all 7 supported languages (label + code); dispatches `change` event with new lang code
- [x] 9.2 Write Vitest tests for `LanguageSelector.svelte`: renders all 7 options; default value is `en`; selecting an option dispatches `change` with correct code

## 10. Frontend — Search Page Integration

- [x] 10.1 In `ui/src/routes/(app)/search/+page.server.ts`: fetch `/api/series` (via `${API_BASE}/api/series`) and add `series: SeriesItem[]` to returned data (empty array on failure); keep existing name-search and legacy `mode=set` SSR logic
- [x] 10.2 In `ui/src/routes/(app)/search/+page.svelte`: rename tabs to "By Name" and "By Series"; remove the By Set & Number form and `SetPicker` import; add `SeriesBrowser` component in the By Series tab wired to `data.series`
- [x] 10.3 Add `LanguageSelector` to the By Name tab; bind selected language to a `lang` state variable; pass `&lang={lang}` to the `/api/cards/search` fetch
- [x] 10.4 Keep legacy deep-link handling: if page loads with `mode=set` + `setId` + `cardNumber` in URL, execute card lookup and show result card (existing SSR path already handles this — verify it still works)
- [x] 10.5 Update `ui/src/tests/search.test.ts` fixtures: add `series: []` to all `data` props; add tests for tab switching to "By Series" renders `SeriesBrowser`; language selector change passes `lang` param to fetch
- [x] 10.6 Remove `ui/src/routes/api/sets/+server.ts` (the old sets list proxy) and `ui/src/lib/components/SetPicker.svelte` — no longer needed

## 11. Quality Gates

- [x] 11.1 `bun run lint` from repo root — zero errors
- [x] 11.2 `bun run check` in `ui/` — zero type errors or warnings
- [x] 11.3 `bun run test` in `server/` — all tests pass
- [x] 11.4 `bun run test` in `ui/` — all tests pass
- [x] 11.5 `playwright-cli` smoke test — By Name tab: search "Pikachu" in English, verify cards appear; switch to Japanese, search "ピカチュウ", verify Japanese results appear (TCGdex GraphQL indexes English names only; Japanese search returns clean empty state — lang param is validated + sent correctly)
- [x] 11.6 `playwright-cli` series browser — switch to By Series tab; click any series tile; verify Column 2 appears with set tiles; click any set; verify Column 3 appears with holographic card grid
- [x] 11.7 `playwright-cli` breadcrumb — navigate to Column 3; click the series segment in breadcrumb; verify reset to Column 1 full-width
- [x] 11.8 `playwright-cli` legacy deep-link — navigate to `/search?mode=set&setId=sv03.5&cardNumber=92`; verify Gastly card appears without user interaction
- [x] 11.9 `security-secure-coding` skill — resolve all findings
- [ ] 11.10 Human manual test: browse Series › Scarlet & Violet › 151; confirm all card images load; click a card to open modal; confirm holographic effect works
- [ ] 11.11 Push feature branch and open PR via `gh pr create`
