## 1. Backend — Service Layer

- [x] 1.1 Add `getCardBySetAndNumber(setId: string, cardNumber: string): Promise<TcgCard>` to `server/src/services/tcg-proxy.ts`. Call `GET https://api.tcgdex.net/v2/en/sets/{setId}/{cardNumber}`, reuse `mapUpstreamCard` and `fetchWithTimeout`. Throw `TcgProxyServiceError` with status 404 on upstream 404, 502/504 otherwise.
  - **Verification**: Unit test passes (see task 2.1)

- [x] 1.2 Add `GET /api/cards/by-set` route to `server/src/routes/tcg-proxy.ts`. Read `setId` and `cardNumber` query params; return 400 if either is blank, delegate to `getCardBySetAndNumber`, return 200 + single card JSON.
  - **Verification**: `curl "http://localhost:3000/api/cards/by-set?setId=SVN&cardNumber=112"` returns a card object

## 2. Backend — Tests

- [x] 2.1 Add Vitest tests for `getCardBySetAndNumber` in `server/src/services/tcg-proxy.test.ts` (or new test file): valid card, upstream 404 → throws 404, upstream 500 → throws 502, timeout → throws 504.
  - **Verification**: `bun run test` in `server/` passes

- [x] 2.2 Add Vitest tests for `GET /api/cards/by-set` route: 200 with card, 400 on missing params, 404 on not-found upstream.
  - **Verification**: `bun run test` in `server/` passes with new test cases

## 3. Backend — Postman Collection

- [x] 3.1 Add "Get card by set ID" request to `docs/postman/` collection: `GET /api/cards/by-set?setId=SVN&cardNumber=112`. Include a negative example with missing params.
  - **Verification**: Postman collection imports cleanly and requests execute

## 4. Frontend — SvelteKit Proxy Route

- [x] 4.1 Create `ui/src/routes/api/cards/by-set/+server.ts` that forwards `setId` and `cardNumber` params to `${API_BASE}/api/cards/by-set` and returns the response body + status unchanged (mirrors existing `/api/cards/search/+server.ts`).
  - **Verification**: `curl "http://localhost:4000/api/cards/by-set?setId=SVN&cardNumber=112"` returns a card from the UI server

## 5. Frontend — Search UI

- [x] 5.1 Add a mode selector (segmented two-button toggle: "By Name" / "By Set & Number") to `ui/src/routes/(app)/search/+page.svelte`. Default to "By Name". No functional change to existing name search.
  - **Verification**: Toggle renders correctly; clicking switches modes; no visual regression on "By Name" path

- [x] 5.2 Implement the "By Set & Number" form: two inputs (Set ID placeholder `SVN`, Card Number placeholder `112`). On submit, call `GET /api/cards/by-set?setId=...&cardNumber=...` and display the single card in the existing card grid. Show user-friendly error if card not found.
  - **Verification**: Entering `SVN` + `112` and submitting shows the correct card in the grid

- [x] 5.3 Sync mode + set/number params to the URL (`?mode=set&setId=SVN&cardNumber=112`) on search execution, so the result is shareable and survives reload. Clear set params when switching back to "By Name" mode.
  - **Verification**: After a set search, copy the URL, open a new tab — same card appears

- [x] 5.4 Update `ui/src/routes/(app)/search/+page.server.ts` to read `mode`, `setId`, and `cardNumber` from URL params on SSR load. If `mode=set`, call the by-set proxy instead of name search and return the single card.
  - **Verification**: Directly visiting `?mode=set&setId=SVN&cardNumber=112` renders the card without client-side JS

## 6. Quality & Verification

- [x] 6.1 Run `bun run lint` from repo root — zero errors.
  - **Verification**: Command exits 0

- [x] 6.2 Run `bun run check` in `ui/` — zero type errors.
  - **Verification**: Command exits 0

- [x] 6.3 Run `bun run test` in both `server/` and `ui/` — all tests pass.
  - **Verification**: Both commands exit 0

- [x] 6.4 Use `playwright-cli` to take a screenshot of the Search tab in both modes and confirm no visual regressions.
  - **Verification**: Screenshots show toggle + correct form for each mode; card grid renders the set-lookup result

- [x] 6.5 Run `security-secure-coding` skill and resolve all findings before opening PR.
  - **Verification**: Skill reports no unresolved findings

- [ ] 6.6 Human manual test: open the Search tab, switch to "By Set & Number", enter `SVN` and `112`, submit, confirm the correct card appears. Copy the URL and paste in a new tab — confirm the card still appears.
  - **Verification**: Both flows work as expected
