## 1. Tests (failing first — TDD)

- [x] 1.1 Add unit test in `SeriesBrowser.test.tsx`: assert that cards render in column 3 after `selectSet` is called (mocking `fetch`). Confirm test fails before fix.
  - Verification: `bun run test` in `ui/` shows new test failing
- [x] 1.2 Add unit test in `Card.test.tsx` (or create it): assert that `isChased={true}` renders a `★` element with `aria-label="On your chase list"`, and `isChased={false}` renders no star.
  - Verification: `bun run test` shows new Card tests failing

## 2. Fix: SeriesBrowser card grid regression

- [x] 2.1 Investigate why column 3 cards are not visible by snapshotting the Browse Series → set drill-down flow via `playwright-cli`. Confirm whether the container is clipping or the cards simply aren't rendering.
  - Verification: `playwright-cli snapshot` shows column 3 DOM present or absent
- [x] 2.2 Fix `.series-browser` CSS in `SeriesBrowser.module.css`: replace `overflow: hidden` + `min-height: 400px` with a layout that gives columns a defined height. Apply `flex: 1; min-height: 0` to `.series-browser` and ensure `.app-main` / `.page` propagate height correctly.
  - Verification: `playwright-cli snapshot` after Docker rebuild shows cards visible in column 3
- [x] 2.3 Run `docker compose up -d --build` and verify via `playwright-cli screenshot` that browsing to a series → set shows the card grid at desktop viewport.
  - Verification: Screenshot shows card grid rendered with no clipping

## 3. Feature: Chase star badge on `Card`

- [x] 3.1 Add `isChased?: boolean` prop to `Card` component (`ui/src/lib/components/Card.tsx`). Render an absolutely-positioned `★` span with CSS Module class `.card__chase-badge` when `isChased` is true. Add `aria-label="On your chase list"`.
  - Verification: `npm run check` passes; Storybook or Playwright snapshot shows badge
- [x] 3.2 Add `.card__chase-badge` styles in `Card.module.css`: position top-right, gold/accent color, semi-transparent dark backdrop, small font size. Ensure it does not interfere with the holographic overlay layers.
  - Verification: Visual check via `playwright-cli screenshot` — badge is visible and doesn't obscure card art

## 4. Feature: Chase awareness in SearchPage and SeriesBrowser

- [x] 4.1 Update `SearchPage.tsx` (By Name mode): pass `isChased={chaseIds.has(card.id)}` to each `<Card>` in the search results grid.
  - Verification: `npm run check` passes; search for a card that is on chase list shows star
- [x] 4.2 Add `chaseIds?: Set<string>` prop to `SeriesBrowser`. Pass `chaseIds` from `SearchPage` to `<SeriesBrowser>`. In the column 3 card render loop, pass `isChased={chaseIds?.has(item.id) ?? false}` to each `<Card>`.
  - Verification: `npm run check` passes; series drill-down shows star on chased cards
- [x] 4.3 Update `SearchPage` server component (`page.tsx`) to ensure `initialChaseIds` is still fetched and passed down.
  - Verification: `npm run check` passes; page loads without errors

## 5. Validation

- [x] 5.1 Run all tests: `bun run test` in `ui/`. All tests including new ones must be green.
  - Verification: Zero failing tests
- [x] 5.2 Run type check: `npm run check` in `ui/`. Zero errors.
  - Verification: Clean output
- [x] 5.3 Run lint: `bun run lint` from repo root. Zero errors.
  - Verification: Clean output
- [x] 5.4 Docker rebuild and Playwright end-to-end verification:
  - Browse by Series → select a series → select a set → cards are visible ✓
  - Search for a card on the chase list → star badge visible in top-right corner ✓
  - Search for a card NOT on the chase list → no star badge ✓
  - `playwright-cli screenshot` captures both scenarios
  - Verification: Screenshots confirm expected behavior
- [ ] 5.5 Manual sign-off: human verifier confirms the Browse Series card grid and chase star badge work as described on `localhost:4000`. PR: https://github.com/AfoD3V/poke-hub/pull/31
