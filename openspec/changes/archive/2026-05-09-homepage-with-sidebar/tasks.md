## 1. Route Structure Refactor

- [x] 1.1 Create the `(app)` route group directory at `ui/src/routes/(app)/` and move `search/` and `collection/` into it. Update any test imports that reference the old paths.
  - *Verification*: `bun run check` in `ui/` passes with no type errors after the move.

- [x] 1.2 Create `ui/src/routes/(app)/+layout.svelte` as the authenticated app shell. It should render `<Sidebar />` plus a `<slot />` for page content, using a two-column flex/grid layout (sidebar fixed-width left column, content fills the rest).
  - *Verification*: Navigating to `/search` in the browser shows the sidebar placeholder alongside existing content.

- [x] 1.3 Ensure `ui/src/routes/auth/+layout.svelte` (or a new one) remains outside `(app)/` so auth pages do not inherit the sidebar layout.
  - *Verification*: Visiting `/auth/login` renders no sidebar element.

## 2. Sidebar Component

- [x] 2.1 Create `ui/src/lib/components/Sidebar.svelte`. Include: PokeHub brand mark at top, nav links for Home (`/home`), Search (`/search`), Collection (`/collection`), and a logout action at the bottom. Use `$page.url.pathname` for active-link detection.
  - *Verification*: Each nav link applies an active CSS class only when on its respective route.

- [x] 2.2 Add ARIA landmark (`<nav aria-label="Main navigation">`) and ensure all links are keyboard-focusable with visible focus rings.
  - *Verification*: Tab through the sidebar — each link gets a visible outline; pressing Enter navigates correctly.

- [x] 2.3 Style the sidebar to match the dark theme (`bg-ph-bg` or slightly lighter surface, `border-r border-white/5`). Use `font-syne` for brand mark and `font-dm` for nav links. Active link uses `text-ph-purple-light` or a subtle highlight background.
  - *Verification*: Playwright screenshot confirms sidebar appearance matches dark theme.

## 3. Home Dashboard

- [x] 3.1 Create `ui/src/routes/(app)/home/+page.server.ts`. Fetch the user's collection from `/api/cards/collection` (forwarding the session cookie). Derive `totalCards` and `uniquePokemon` counts server-side. Redirect to `/auth/login` if the session cookie is absent.
  - *Verification*: Visiting `/home` without a session redirects to login; with a session the page loads.

- [x] 3.2 Create `ui/src/routes/(app)/home/+page.svelte`. Render a welcome heading, two stat cards (Total Cards, Unique Pokémon), and two quick-action buttons/links (Search Cards → `/search`, My Collection → `/collection`). Handle the empty-collection zero-state with a prompt to browse.
  - *Verification*: With a non-empty collection both stat numbers display correctly; with empty collection both show 0 and the prompt is visible.

- [x] 3.3 Update `ui/src/routes/+page.server.ts` to redirect authenticated users to `/home` instead of `/search`.
  - *Verification*: Logging in redirects to `/home`; visiting `/` with a valid session redirects to `/home`.

## 4. Inline Navbar Removal

- [x] 4.1 Remove the `<header>` inline navbar block from `ui/src/routes/(app)/collection/+page.svelte`. The sidebar provides all navigation.
  - *Verification*: `/collection` renders no `<header>` element with nav links; all card grid functionality is intact.

- [x] 4.2 Remove the `<header>` inline navbar block from `ui/src/routes/(app)/search/+page.svelte`.
  - *Verification*: `/search` renders no `<header>` element with nav links; search functionality is intact.

## 5. Quality & Verification

- [x] 5.1 Run `bun run check` in `ui/` — zero TypeScript / Svelte type errors.
  - *Verification*: Command exits with code 0.

- [x] 5.2 Run `bun run test` in `ui/` — all existing tests pass. Update any test file paths broken by the route group move.
  - *Verification*: All tests green.

- [x] 5.3 Take Playwright snapshots of: Sidebar on `/home`, Sidebar on `/search`, Sidebar on `/collection`, and the home dashboard zero-state. Confirm no visual regressions on the card grid or search UI.
  - *Verification*: Screenshots match expected dark-theme layout; sidebar is visible on all app pages and absent on `/auth/login`.

- [x] 5.4 Manual walkthrough: login → lands on `/home` → click Search in sidebar → search for a card → click Collection in sidebar → remove a card → confirm all flows work end-to-end.
  - *Verification*: No console errors, no broken navigations, active link updates correctly on each route.
