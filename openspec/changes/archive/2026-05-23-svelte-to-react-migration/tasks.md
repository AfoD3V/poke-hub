## 1. Tests (Failing) — Write All Tests First

- [x] 1.1 Write `useSpring` unit tests in `ui-react/src/lib/hooks/useSpring.test.ts`: settle-to-target, stiffness comparison, damping overshoot, soft-set behaviour. **Verify:** `bun run test` reports 4 failing tests (hook does not exist yet).
- [x] 1.2 Write `Card.test.tsx` smoke test (renders without throw) + pointer-move test (CSS variables written to style). **Verify:** test file exists, tests fail with "Cannot find module".
- [x] 1.3 Write `HoverTilt.test.tsx`: renders children, pointer-move applies transform, pointer-leave resets. **Verify:** tests fail as expected.
- [x] 1.4 Write `CardModal.test.tsx`: renders card details, Escape key calls onClose, backdrop click calls onClose. **Verify:** tests fail as expected.
- [x] 1.5 Write smoke tests for `Toast`, `Sidebar`, `LanguageSelector`, `SeriesBrowser` (each renders without throw). **Verify:** 4 failing tests.
- [x] 1.6 Write route-level tests for middleware: unauthenticated request to `/(app)/home` gets 307 redirect, authenticated request passes through. **Verify:** tests fail as expected.
- [x] 1.7 Write Server Action tests: `login()` with valid creds sets cookie + redirects, invalid creds returns error; `register()` success + duplicate email error; `logout()` deletes cookie. **Verify:** all fail as expected.

## 2. Project Bootstrap

- [x] 2.1 Create `ui-react/` with `npx create-next-app@14 ui-react --typescript --app --no-tailwind --src-dir --import-alias "@/*"`. Remove default boilerplate (page content, globals.css resets). **Verify:** `cd ui-react && npx tsc --noEmit` exits 0.
- [x] 2.2 Add `$shared/*` path alias: in `ui-react/tsconfig.json` add `"paths": { "$shared/*": ["../../shared/*"] }`. **Verify:** create a temp file importing `import type { TcgCard } from '$shared/tcg'` and confirm `tsc --noEmit` passes.
- [x] 2.3 Copy ESLint config from `ui/.eslintrc.*` to `ui-react/`; add `eslint-plugin-react-hooks`. **Verify:** `eslint .` in `ui-react/` exits 0.
- [x] 2.4 Configure Vitest + jsdom in `ui-react/vitest.config.ts`; add `@testing-library/react` and `@testing-library/user-event`. **Verify:** `bun run test` runs (all tests from §1 now discovered; they still fail on missing implementations).
- [x] 2.5 Write `ui-react/Dockerfile` (two-stage: `next build` → `node server.js`; enable Next.js `output: "standalone"` in `next.config.ts`). **Verify:** `docker build -f ui-react/Dockerfile -t pokehub-ui-react .` completes without error.
- [x] 2.6 Add `ui-react` service to `docker-compose.yml` on port 4001 (same network as `ui`, same `BACKEND_URL` env). **Verify:** `docker compose up ui-react` → `curl http://localhost:4001` returns non-500 response.

## 3. useSpring Hook

- [x] 3.1 Implement `ui-react/src/lib/hooks/useSpring.ts`: damped-spring RAF loop, `{ stiffness, damping }` config, soft-set option, generic object type `T`. **Verify:** all `useSpring` unit tests from §1.1 pass (`bun run test`).
- [ ] 3.2 Take a reference Playwright screenshot of the current Svelte `Card` component hovered at center for use as visual regression baseline. Save as `ui-react/tests/baseline/card-holo-center.png`. **Verify:** file exists and shows the shine effect active.

## 4. CSS Extraction

- [x] 4.1 Create `ui-react/src/lib/components/Card.module.css` — copy the entire `<style>` block from `ui/src/lib/components/Card.svelte` verbatim. Replace Svelte-scoped implicit selectors (bare `.card`) with explicit `:local(.card)` if needed by CSS Modules (test: run `next build`, check for CSS parse errors). **Verify:** `next build` completes without CSS errors.
- [x] 4.2 Create `HoverTilt.module.css` from `HoverTilt.svelte` style block. **Verify:** `next build` exits 0.
- [x] 4.3 Create `CardModal.module.css` from `CardModal.svelte` style block. **Verify:** `next build` exits 0.
- [x] 4.4 Create `Toast.module.css`, `Sidebar.module.css`, `LanguageSelector.module.css`, `SeriesBrowser.module.css` from respective Svelte style blocks. **Verify:** `next build` exits 0; `bun run lint` exits 0.

## 5. HoverTilt Component

- [x] 5.1 Implement `HoverTilt.tsx`: accept `children`, `tiltFactor`, `scaleFactor`, `shadow` props; use `useSpring` for rotation; apply `perspective(1000px) rotateX(Xdeg) rotateY(Ydeg) scale(S)` via inline `style`. Import from `HoverTilt.module.css`. **Verify:** `HoverTilt.test.tsx` tests from §1.3 all pass.
- [ ] 5.2 **Human validation:** Run `docker compose up ui-react`, navigate to a dev route that renders `<HoverTilt>` with a static div child; hover slowly — confirm spring-physics tilt with no jitter. Check console for zero errors.

## 6. Card Component

- [x] 6.1 Implement `Card.tsx`: port `resolveRarity`, `interact`, `interactEnd`, `dynStyles` computation from `Card.svelte`. Use `useSpring` for `springGlare` and `springBg` with same stiffness/damping pairs. Write CSS variables to `style` prop on root div. Wrap rotator in `<HoverTilt>`. Import from `Card.module.css`. **Verify:** `Card.test.tsx` tests from §1.2 all pass.
- [x] 6.2 Confirm `data-rarity`, `data-subtypes`, `data-supertype` attributes are set on the root div and that `className` contains the type string (e.g. `"water"`). **Verify:** `tsc --noEmit` exits 0; render a rare-holo card in jsdom and assert `data-rarity="rare holo"` attribute exists.
- [ ] 6.3 **Human validation:** Navigate to the dev component page in `ui-react`, hover a rare-holo card, a secret-rare card, and a reverse-holo card. Confirm each rarity's holo effect activates. Take Playwright screenshot; diff against baseline from §3.2 — pixel diff must be < 2%.

## 7. CardModal Component

- [x] 7.1 Implement `CardModal.tsx`: accept `card: TcgCard`, `onClose: () => void`; render card image, name, set, number, rarity, types, HP, attacks, weaknesses; Escape key listener via `useEffect`; backdrop `onClick` calls `onClose`. Import from `CardModal.module.css`. **Verify:** all `CardModal.test.tsx` tests from §1.4 pass.
- [ ] 7.2 **Human validation:** Open a card modal on the dev page; press Escape — modal closes. Click backdrop — modal closes. Resize viewport to mobile — modal still usable.

## 8. Remaining Components

- [x] 8.1 Implement `Toast.tsx` (notification toast with severity + message props, auto-dismiss timer). **Verify:** smoke test from §1.5 passes; `tsc --noEmit` exits 0.
- [x] 8.2 Implement `Sidebar.tsx` (nav links: Home, Search, Collection; active link highlighted via `usePathname()`; keyboard accessible). **Verify:** smoke test from §1.5 passes; `tsc --noEmit` exits 0.
- [x] 8.3 Implement `LanguageSelector.tsx` and `SeriesBrowser.tsx` (port from Svelte). **Verify:** smoke tests pass; `tsc --noEmit` exits 0.
- [ ] 8.4 **Human validation:** Run `bun run test` in `ui-react/` — all component tests pass. Run `bun run lint` — zero errors.

## 9. Middleware + Route Structure

- [x] 9.1 Create `ui-react/src/middleware.ts`: match paths `/home*`, `/search*`, `/collection*`, `/admin*`; read `pokehub_session` cookie; if absent redirect to `/auth/login`. **Verify:** middleware unit tests from §1.6 pass.
- [x] 9.2 Create `app/layout.tsx` (root layout: HTML/body shell, font imports matching current `ui/` fonts). **Verify:** `next build` exits 0.
- [x] 9.3 Create `app/(app)/layout.tsx` with `<Sidebar>` + `<main>` wrapper. Create `app/auth/layout.tsx` with no Sidebar. **Verify:** Playwright — `/home` has Sidebar in DOM; `/auth/login` does not.
- [x] 9.4 Create `app/page.tsx` (root redirect): if `pokehub_session` cookie exists redirect to `/home`, else redirect to `/auth/login`. **Verify:** Playwright — unauthenticated visit to `/` lands on `/auth/login`; authenticated visit lands on `/home`.
- [x] 9.5 Create `app/auth/login/page.tsx` and `app/auth/register/page.tsx` (form-only UI, no data loading). **Verify:** `curl http://localhost:4001/auth/login` returns 200; forms render in Playwright snapshot.
- [x] 9.6 Create all 9 API route handlers in `app/api/**/route.ts` (proxy to `BACKEND_URL`, forward cookie, 502 on network error). **Verify:** `curl http://localhost:4001/api/series` (no auth needed) returns series JSON from Hono.

## 10. Data-Loading Server Components

- [x] 10.1 Create `app/(app)/home/page.tsx` as async Server Component: fetch `/api/collection` and `/api/chase` from `BACKEND_URL` (forward cookie from `next/headers`); compute stats (total cards, unique Pokémon, per-set counts, rarity breakdown) server-side; render home dashboard. **Verify:** Playwright authenticated visit to `/home` shows stats in initial HTML (view-source, not client JS).
- [x] 10.2 Create `app/(app)/search/page.tsx`: render `<SeriesBrowser>` and card search form; search results fetched client-side via `/api/cards/search` route handler. **Verify:** Playwright — search for "pikachu" returns card grid.
- [x] 10.3 Create `app/(app)/collection/page.tsx` as async Server Component: fetch collection from `BACKEND_URL`; render card grid with `<Card>` components and expand-to-modal behaviour. **Verify:** Playwright — collection page renders cards; clicking a card opens `<CardModal>`.
- [x] 10.4 Create admin pages (`/admin`, `/admin/users`, `/admin/users/[id]`, `/admin/cache`) porting logic from SvelteKit equivalents. **Verify:** `tsc --noEmit` exits 0; Playwright admin visit returns 200.

## 11. Auth Server Actions

- [x] 11.1 Implement `app/auth/login/actions.ts` `login(formData)` Server Action: POST to `BACKEND_URL/auth/login`, extract `Set-Cookie`, call `cookies().set()`, redirect to `/home` on success or return error. Wire to login form. **Verify:** login Server Action tests from §1.7 pass.
- [x] 11.2 Implement `app/auth/register/actions.ts` `register(formData)` Server Action: POST to `BACKEND_URL/auth/register`, same cookie pattern, redirect to `/home`. Wire to register form. **Verify:** register Server Action tests from §1.7 pass.
- [x] 11.3 Implement `logout()` Server Action (in Sidebar or `app/auth/logout/actions.ts`): `cookies().delete('pokehub_session')`, redirect to `/auth/login`. **Verify:** logout Server Action test from §1.7 passes.
- [ ] 11.4 **Human validation:** Full E2E flow in `ui-react` (port 4001): register new account → lands on /home with stats → search for a card → add to collection → logout → login again → collection persists. All via Playwright CLI.

## 12. Visual Regression

- [ ] 12.1 Take Playwright screenshots of every main page in both `ui` (port 4000) and `ui-react` (port 4001): `/home`, `/search`, `/collection`, card modal open, card holo hover (rare holo, secret rare, reverse holo). Save as `ui-react/tests/visual/`. **Verify:** 10+ screenshot pairs captured.
- [ ] 12.2 **Human validation:** Open screenshot pairs side-by-side. Confirm: sidebar layout, font sizes, card grid spacing, holo effect appearance, modal overlay are visually identical. Document any acceptable intentional differences.
- [ ] 12.3 Fix all visual discrepancies found in §12.2. **Verify:** re-run Playwright screenshots; human sign-off.

## 13. Full Test Suite

- [x] 13.1 Run `bun run test` in `ui-react/` — all tests green. **Verify:** 31 tests, 0 failures.
- [x] 13.2 Run `bun run lint` in `ui-react/` — zero ESLint errors. **Verify:** only warnings (no-img-element), exits 0.
- [x] 13.3 Run `tsc --noEmit` in `ui-react/` — zero type errors. **Verify:** exits 0 with no output.

## 14. Cutover

- [x] 14.1 Rename `ui/` to `ui-svelte/` (keep as backup). Rename `ui-react/` to `ui/`. Update `docker-compose.yml`: change `ui` service build context from `ui-svelte/Dockerfile` to `ui/Dockerfile`; remove the temporary `ui-react` service entry on port 4001. **Verify:** `docker compose config` shows no references to `ui-react`.
- [x] 14.2 Update any CI/CD paths that reference the `ui/` build directory (GitHub Actions `.yml` files). **Verify:** `git grep "ui-svelte"` returns no matches in CI files.
- [ ] 14.3 Run `docker compose up -d --build` from repo root. **Verify:** `curl http://localhost:4000` serves the Next.js app (not SvelteKit); Playwright full-stack E2E login flow passes on port 4000.
- [ ] 14.4 **Human validation:** Full production-mode smoke test on port 4000: login, search, collection, card modal, chase board, logout. All features work. No console errors.
- [x] 14.5 Delete `ui-svelte/` backup directory. Update `CLAUDE.md` and `AGENTS.md`: replace all SvelteKit-specific gotchas with Next.js equivalents; update architecture description; note current phase. **Verify:** `git diff --name-only` shows `CLAUDE.md` and `AGENTS.md` both modified.
- [ ] 14.6 Create PR `feature/svelte-to-react-migration` → `main`. **Verify:** `gh pr status` shows PR open; all CI checks green.
