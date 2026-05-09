## 1. Branch & Design Token Foundation

- [x] 1.1 Create feature branch: `git checkout main && git fetch origin && git pull origin main && git checkout -b feature/frontend-design-overhaul`
- [x] 1.2 Update `ui/tailwind.config.ts`: replace all purple tokens with the new black/red palette (`ph-bg: #000000`, `ph-surface: #111111`, `ph-card: #161616`, `ph-accent: #E3000B`, `ph-accent-dim`, `ph-red-glow`, `ph-text: #FFFFFF`, `ph-muted: #707070`). Remove `ph-purple`, `ph-purple-light`, `ph-border-accent`. Add `ph-accent` / `ph-accent-dim` / `ph-red-glow`. Update `fontFamily` to include `Geist`. Update `boxShadow` to replace glow-purple with glow-red variants.
  - **Verification**: Run `bun run lint` — no errors. Check `tailwind.config.ts` has no purple token names.
- [x] 1.3 Update `ui/src/app.html`: add Google Fonts preconnect + `<link>` for Geist (weights 400;700;900). Remove any Syne or DM Sans font links.
  - **Verification**: Open browser DevTools → Network tab → confirm Geist font file loads.
- [x] 1.4 Update `ui/src/app.css`: set `body { font-family: 'Geist', sans-serif; }`. Remove any `@import` for Syne or DM Sans. Update `.auth-label`, `.form-input`, `.btn-primary` global CSS classes to use new tokens and Geist.
  - **Verification**: `bun run check` — zero svelte-check errors.

## 2. Sidebar & App Layout

- [x] 2.1 Rewrite `ui/src/lib/components/Sidebar.svelte` visual design: pure black background (`bg-ph-bg`), no right border (use box-shadow instead), "Poke" white + "Hub" red wordmark in Geist 900, active nav link gets a 2px left red border + white text (replace purple background fill), hover states use white text only, sign-out button red on hover. Remove all `ph-purple` class references.
  - **Verification**: `playwright-cli snapshot` — sidebar shows black bg, red "Hub", red active indicator.
- [x] 2.2 Update `ui/src/routes/(app)/+layout.svelte`: change root div background to `bg-ph-bg` (pure black). Remove any border between sidebar and main content.
  - **Verification**: Visually confirm pure black background with no purple tint.

## 3. Auth Pages

- [x] 3.1 Update `ui/src/routes/auth/+layout.svelte`: full-bleed black background (`bg-ph-bg`), centered content vertically and horizontally.
- [x] 3.2 Redesign `ui/src/routes/auth/login/+page.svelte`: add large "PokeHub" Geist 900 wordmark above the form card; form card uses `bg-ph-card` with no visible border (large `drop-shadow` instead); inputs get borderless-feel style (bottom border only or `border-white/8` subtle); primary submit button is solid `bg-ph-accent text-white` Geist bold. Remove all purple class references.
  - **Verification**: `playwright-cli snapshot` — login page shows black bg, red submit button, no purple.
- [x] 3.3 Redesign `ui/src/routes/auth/register/+page.svelte` with same treatment as login.
  - **Verification**: `playwright-cli snapshot` — register page consistent with login.

## 4. HoverTilt Component (Svelte 4 Adaptation)

- [x] 4.1 Copy `resources/hover-tilt/packages/hover-tilt/src/lib/components/HoverTilt.svelte` to `ui/src/lib/components/HoverTilt.svelte`. Adapt all Svelte 5 rune syntax to Svelte 4: replace `$props()` with `export let` declarations, `new Spring(v, opts)` → `spring(v, opts)` from `svelte/motion`, `$derived(...)` → `$:` reactive, `$state<T>` → typed `let`, event handlers `onpointerX` → `on:pointerX`.
  - **Verification**: `bun run check` in `ui/` — zero errors on `HoverTilt.svelte`.
- [x] 4.2 Smoke-test HoverTilt by temporarily wrapping one element and verifying tilt motion works in the browser before integrating everywhere.
  - **Verification**: Manual browser check — element tilts with spring physics on hover.

## 5. Card Component (Grid Cards)

- [x] 5.1 Update `ui/src/lib/components/Card.svelte`: change default `--card-glow` from blue `hsl(215,90%,70%)` to red `hsl(0,90%,44%)`. Keep all type-specific glow overrides.
  - **Verification**: Hover a card with no type — red glow. Hover a water card — blue glow.
- [x] 5.2 Wrap the `card__rotator` / `card__front` area in `<HoverTilt>` in `Card.svelte`. Wire HoverTilt's tilt to drive the holo CSS variables: keep the existing `interact` / `interactEnd` handlers for `--pointer-x`, `--rotate-x` etc., or confirm that HoverTilt's `--hover-tilt-*` CSS variables provide equivalent values for the holo system. Remove the now-redundant spring stores (`springRotate`, `springGlare`, `springBg`) if replaced by HoverTilt.
  - **Verification**: Hover a rare-holo grid card — tilt works AND rainbow scanline holo effect activates simultaneously.
- [x] 5.3 Update card-info section in `Card.svelte`: apply Geist font classes, white card name text, muted set line. Remove `font-syne` / `font-dm` class references.
  - **Verification**: Card names render in Geist bold white.

## 6. Card Modal — 3D Floating Layout (Highest Priority)

- [x] 6.1 Restructure `CardModal.svelte` layout: remove `.modal-layout` flex container. Make `.flip-shadow-wrap` absolutely positioned within the overlay (`position: absolute; top: 50%; left: 35%; transform: translate(-50%, -50%)`). The overlay (`position: fixed; inset: 0`) becomes the sole positioning parent.
  - **Verification**: `playwright-cli snapshot` — card is centred in overlay with no visible bounding box around it.
- [x] 6.2 Convert info panel to a floating aside: `position: absolute; right: 5%; top: 50%; transform: translateY(-50%); background: rgba(17,17,17,0.92); backdrop-filter: blur(20px); border-radius: 1rem; width: 280px`. Remove it from any flex row context.
  - **Verification**: Info panel floats to the right of the card independently, with frosted glass appearance.
- [x] 6.3 Move close button to top-right overlay corner: `position: absolute; top: 1rem; right: 1rem`. Render as icon-only (×) in muted colour, no border in resting state, subtle border on hover.
  - **Verification**: Close button is visually in the top-right corner of the viewport.
- [x] 6.4 Update rarity pill to use red tokens (`background: ph-accent-dim; border-color: ph-accent; color: ph-accent`). Update "Add to Collection" button to red accent style. Remove all purple references from `CardModal.svelte`.
  - **Verification**: Rarity pill and Add button render red, not purple.
- [x] 6.5 Verify flip animation still works correctly after layout restructure: card shows back → flips to holo front → tilt is responsive on the front face.
  - **Verification**: Manual browser test — click a card, observe clean flip, then tilt the holo front.
- [x] 6.6 Verify no overflow/backface-visibility bugs: `overflow: hidden` is NOT on `.face`, only on `.face-inner`. `filter` is NOT on `flip-wrap` (only on `flip-shadow-wrap`).
  - **Verification**: Both faces render correctly during flip; no face visible through the other.

## 7. Collection, Home & Search Pages

- [x] 7.1 Update `ui/src/routes/(app)/collection/+page.svelte`: page heading Geist 900 white, card grid `minmax(min(160px, 100%), 1fr)` with `gap-3`, empty-state CTA uses red accent button, error banners use existing red token. Remove purple class references (`bg-ph-purple`, `text-ph-purple-light`).
  - **Verification**: Collection grid is denser than before; heading is white Geist bold.
- [x] 7.2 Update `ui/src/routes/(app)/home/+page.svelte`: heading Geist 900, stats cards borderless (`border-white/4`), primary quick-action link uses `bg-ph-accent/10 border-ph-accent/30` hover red accent. Remove purple class references.
  - **Verification**: Home page has red-accented primary action, no purple.
- [x] 7.3 Update `ui/src/routes/(app)/search/+page.svelte`: search input borderless-feel (bottom border only or `border-white/8`), results grid uses same dense layout as collection, result card click opens modal with new design.
  - **Verification**: Search renders dense results grid, no purple.

## 8. Quality & Definition of Done

- [x] 8.1 Run `grep -r "ph-purple\|font-syne\|font-dm\|DM Sans\|Syne" ui/src` — confirm zero matches.
  - **Verification**: Command returns no output.
- [x] 8.2 Run `bun run lint` from repo root — zero ESLint errors.
  - **Verification**: Clean lint output.
- [x] 8.3 Run `bun run check` in `ui/` — zero svelte-check / TypeScript errors.
  - **Verification**: Clean type check output.
- [x] 8.4 Run `bun run test` in `ui/` — all existing tests pass.
  - **Verification**: Test suite green.
- [x] 8.5 `playwright-cli open http://localhost:5173` → `playwright-cli snapshot` on: login page, sidebar, collection grid, card modal (after clicking a card). Confirm visual result matches new design intent — black bg, Geist font, red accents, floating card in modal.
  - **Verification**: Screenshots show no purple, correct Geist rendering, red accents.
- [x] 8.6 Run `security-secure-coding` skill — resolve any findings before merge.
  - **Verification**: No unresolved security findings.
- [x] 8.7 Document any new framework gotchas discovered during implementation in `AGENTS.md` > Project Learnings. Update `CLAUDE.md` to match.
  - **Verification**: Both files updated in same commit if any gotchas found.
- [x] 8.8 Push branch and open PR: `gh pr create --title "feat(ui): black/red design system overhaul + floating card modal"`.
  - **Verification**: PR link returned; CI passes.
