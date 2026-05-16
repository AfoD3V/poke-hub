## 1. Write Failing Tests (TDD — Red Phase)

- [ ] 1.1 Write failing Vitest tests for `getSets()` service: successful GraphQL fetch returns sorted array with `id`, `name`, `abbreviation`, `cardCount`, `releaseDate`; upstream 502 throws `TcgProxyServiceError`
- [ ] 1.2 Write failing Vitest tests for `GET /api/sets` route: 200 with array, 502 on upstream failure, second call within TTL makes only one upstream request (cache hit)
- [ ] 1.3 Write failing Vitest UI tests for `SetPicker.svelte`: renders combobox with correct ARIA roles on mount; filters by name (case-insensitive); filters by abbreviation; filters by TCGdex ID prefix; shows "No sets found" when no match; selecting an option emits `select` event with `{ id, label }`; keyboard navigation (↑↓ Enter Escape)
- [ ] 1.4 Run all new tests and confirm they fail (red)

## 2. Backend — Sets Service

- [ ] 2.1 Add module-level cache object `{ data: SetItem[] | null, expiresAt: number }` to `server/src/services/tcg-proxy.ts`
- [ ] 2.2 Add TCGdex GraphQL query constant for sets (`id`, `name`, `abbreviation { official }`, `releaseDate`, `cardCount { official }`)
- [ ] 2.3 Implement `getSets()`: check cache validity; if stale/empty fetch GraphQL; map to `SetItem[]`; sort by `releaseDate` descending; update cache with 24h TTL; return array
- [ ] 2.4 Add `SetItem` type to `shared/tcg.ts` (or `server/src/services/tcg-proxy.ts`) with fields `id`, `name`, `abbreviation`, `cardCount`, `releaseDate`
- [ ] 2.5 Run service tests — confirm they pass (green)

## 3. Backend — Sets Route

- [ ] 3.1 Add `GET /api/sets` route handler to `server/src/routes/tcg-proxy.ts` (before the cards routes); call `getSets()`; return 200 with JSON array; map `TcgProxyServiceError(502)` to 502
- [ ] 3.2 Run route tests — confirm they pass (green)

## 4. Backend — Postman

- [ ] 4.1 Add "Sets - List (Positive)" request to `docs/postman/pokehub.postman_collection.json`: `GET {{baseUrl}}/api/sets`; verify 200 with non-empty array containing `id`, `name`, `abbreviation`
- [ ] 4.2 Add "Sets - List (Upstream Error)" note/mock request documenting the 502 scenario

## 5. Frontend — SvelteKit Proxy

- [ ] 5.1 Create `ui/src/routes/api/sets/+server.ts` — `GET` handler that forwards to `${API_BASE_URL}/api/sets` and returns the response unchanged (same pattern as `by-set` proxy)
- [ ] 5.2 Verify proxy works: start Docker Compose and call `/api/sets` from the browser — expect 200 JSON array

## 6. Frontend — SetPicker Component

- [ ] 6.1 Create `ui/src/lib/components/SetPicker.svelte` with Svelte 4 patterns (`export let sets`, `createEventDispatcher`, `on:select`)
- [ ] 6.2 Implement input with `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-activedescendant`
- [ ] 6.3 Implement dropdown `role="listbox"` with items `role="option"` and `aria-selected`; show up to 10 results sorted newest-first; display `"Name (ABBR)"` or `"Name"` if no abbreviation
- [ ] 6.4 Implement client-side filtering: match query against `name`, `abbreviation`, and `id` (case-insensitive substring / prefix for id)
- [ ] 6.5 Implement keyboard navigation: ArrowDown/ArrowUp moves highlight; Enter selects highlighted option; Escape closes dropdown without selection; update `aria-activedescendant` on highlight change
- [ ] 6.6 Implement fallback: if `sets` prop is empty array, render a plain `<input>` with placeholder `"Set ID (e.g. sv03.5)"`; emit `select` with the typed value as both `id` and `label`
- [ ] 6.7 Run UI component tests — confirm they pass (green)

## 7. Frontend — Search Page Integration

- [ ] 7.1 In `ui/src/routes/(app)/search/+page.server.ts`: on page load (before name search), fetch `/api/sets` and pass the result as `sets` in the returned data object (empty array on failure)
- [ ] 7.2 In `ui/src/routes/(app)/search/+page.svelte`: import `SetPicker.svelte`; replace the Set ID `<input>` in the "By Set & Number" form with `<SetPicker sets={data.sets} on:select={...} />`; on `select` event write `event.detail.id` into the `setId` state variable
- [ ] 7.3 Ensure the "By Set & Number" lookup still calls `/api/cards/by-set?setId=...&cardNumber=...` with the resolved TCGdex ID
- [ ] 7.4 Update `ui/src/routes/(app)/search/+page.server.ts` types / `PageData` to include `sets: SetItem[]`; fix `search.test.ts` fixtures to include `sets: []`

## 8. Quality Gates

- [ ] 8.1 `bun run lint` from repo root — zero errors
- [ ] 8.2 `bun run check` in `ui/` — zero type errors
- [ ] 8.3 `bun run test` in `server/` — all tests pass
- [ ] 8.4 `bun run test` in `ui/` — all tests pass
- [ ] 8.5 `playwright-cli` visual verification: open Search tab → By Set & Number → focus the SetPicker input → dropdown appears → type "MEW" → "151 (MEW)" appears → select it → Card Number field accepts "92" → Look up returns the correct card
- [ ] 8.6 `playwright-cli` keyboard nav check: open dropdown → ArrowDown to highlight an option → Enter selects it → input shows "Name (ABBR)" label
- [ ] 8.7 `playwright-cli` fallback check: mock `/api/sets` to 500 → SetPicker renders as plain text input with correct placeholder
- [ ] 8.8 `security-secure-coding` skill — resolve all findings
- [ ] 8.9 Human manual test: use the live app to find card MEW-92 using the combobox; confirm the card image and details load correctly
- [ ] 8.10 Push feature branch and open PR via `gh pr create`
