## 1. Tests (Write Failing First — TDD Red Phase)

- [x] 1.1 Write Vitest/jsdom tests for `Sidebar` component: assert it renders bottom nav at mobile width (mock `window.innerWidth = 375`), icon rail at tablet (768px), full sidebar at desktop (1024px). Verification: `bun run test` in `ui/` shows these tests FAIL (no implementation yet).
- [x] 1.2 Write snapshot/accessibility tests: assert each nav link has `aria-label`, active link has `aria-current="page"`, and logout button has `cursor: pointer`. Verification: tests fail with current implementation.

## 2. Sidebar Visual Overhaul (Desktop)

- [x] 2.1 Update `Sidebar.module.css`: change `.sidebar` background from `var(--ph-bg)` to `var(--ph-surface)`, add `border-right: 1px solid var(--ph-border)`. Verification: reload desktop view — sidebar panel is visually distinct from main content.
- [x] 2.2 Increase nav link icon size from 1rem to 1.25rem. Increase active state visual weight (font-weight: 600, brighter text). Increase muted text contrast for non-active links. Verification: nav links are clearly readable at normal zoom.
- [x] 2.3 Increase `.brand` font size and padding slightly. Ensure "PokeHub" brand is prominent at top of sidebar. Verification: brand text is clearly visible and not washed out.

## 3. Responsive App Shell — Layout Breakpoints

- [x] 3.1 Update `layout.module.css`: add `@media (max-width: 767px)` — switch `.app-shell` to `flex-direction: column`, add `padding-bottom: 5rem` to `.app-main`. Verification: at 375px viewport, content flows below where sidebar was (empty for now).
- [x] 3.2 Add CSS custom property `--sidebar-width: 14rem` in `globals.css`, override to `3.5rem` at `768px–1023px`, `0` at `≤767px`. Update `.app-shell` to use this variable. Verification: sidebar width animates on resize.

## 4. Sidebar — Mobile Bottom Nav

- [x] 4.1 Update `Sidebar.tsx`: wrap the existing aside in a conditional. Add a separate `<nav className={styles['bottom-nav']}>` rendered only at mobile (use a CSS class + media query to show/hide, not JS state — avoids hydration mismatch). Verification: bottom nav markup is always in DOM, visible only on mobile.
- [x] 4.2 Add `.bottom-nav` styles in `Sidebar.module.css`: `position: fixed; bottom: 0; left: 0; right: 0; display: none; background: var(--ph-surface); border-top: 1px solid var(--ph-border); padding-bottom: env(safe-area-inset-bottom, 0); z-index: 50`. Add `@media (max-width: 767px) { .bottom-nav { display: flex; } .sidebar { display: none; } }`. Verification: on mobile, bottom nav is visible and sidebar is hidden.
- [x] 4.3 Style bottom nav items: each link is `flex: 1; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; font-size: 10px`. Icons sized 20px. Active state uses accent color. Verification: 3 nav items fit equally across mobile bottom bar with no overflow.

## 5. Sidebar — Tablet Icon Rail

- [x] 5.1 Add `@media (768px and 1023px)` override in `Sidebar.module.css`: `.sidebar { width: 3.5rem; }`, `.nav-link span` (label text) `{ display: none; }`, `.brand-poke, .brand-hub { display: none; }` (or show only "P" icon). Verification: at 768px viewport, sidebar shows icons only in a narrow rail.
- [x] 5.2 Wrap nav link label text in `<span>` in `Sidebar.tsx` so it can be hidden via CSS without hiding the icon. Verification: tablet rail shows icons, labels hidden, `aria-label` remains.

## 6. Home Dashboard — Fluid Layout

- [x] 6.1 Update `HomeDashboard.module.css`: remove `max-width: 900px` from `.page`, set `width: 100%; padding: 1.5rem 2rem`. Add `@media (max-width: 767px) { .page { padding: 1rem; } }`. Verification: home page fills full content width on 1440px screen — no black margins.
- [x] 6.2 Update `.stat-grid`: replace `grid-template-columns: repeat(2, 1fr); max-width: 24rem` with `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); max-width: none`. Verification: stat cards fill width on desktop; 2-column on mobile.
- [x] 6.3 Remove `max-width: 24rem` from `.quick-actions` and `max-width: 32rem` from `.breakdown-grid`. Set `width: 100%`. Verification: breakdown and action sections fill content area on wide screens.

## 7. Chase Board — Fluid Width & Card Scaling

- [x] 7.1 Update `.chase-list` in `HomeDashboard.module.css`: add `width: 100%` and remove any implicit width cap. Update `.chase-set-card`: `width: 100%`. Verification: each set row spans full content width at 1440px.
- [x] 7.2 Update `.chase-thumb img` dimensions: change fixed `width: 72px; height: 100px` to CSS custom properties. Default: `width: 80px; height: 112px`. Add `@media (max-width: 767px) { .chase-thumb img { width: 64px; height: 90px; } }`. Update `.chase-thumb-placeholder` to match. Verification: thumbnails are noticeably larger on desktop and compact on mobile.
- [x] 7.3 Update `.chase-set-name`: increase from `font-size: 9px` to `font-size: 11px`, increase color from `rgba(255,255,255,0.55)` to `rgba(255,255,255,0.80)`. Verification: set names are readable at 100% zoom without magnification.
- [x] 7.4 Update `.chase-set-identity` width: default 160px on desktop. Add `@media (max-width: 767px) { .chase-set-identity { width: 110px; min-width: 110px; } }`. Verification: identity column doesn't overflow on mobile; cards row gets remaining space.

## 8. Collection & Search — Responsive Grids

- [x] 8.1 Read `CollectionView.module.css` fully and identify the card grid selector. Update it to use `repeat(auto-fill, minmax(140px, 1fr))`. Remove any fixed `max-width` on the page container. Verification: collection grid fills content area; 5+ columns on desktop, 2–3 on mobile.
- [x] 8.2 Read `SearchPage.module.css` fully and apply the same responsive grid treatment. Verification: search results grid fills width at all breakpoints.
- [x] 8.3 Ensure card text labels in CollectionView are ≥12px. Check contrast of set name text. Increase if below WCAG AA. Verification: card text readable at 100% zoom on 1440px and 375px screens.

## 9. Tests — Green Phase

- [x] 9.1 Run `bun run test` in `ui/`. Fix any type errors introduced by the Sidebar.tsx refactor. Verification: all tests pass, including the new ones from task group 1.
- [x] 9.2 Run `bun run lint` from repo root. Fix all ESLint errors. Verification: zero lint errors.
- [x] 9.3 Run `npm run check` in `ui/`. Fix any TypeScript errors. Verification: type check exits 0.

## 10. Visual Verification (Playwright)

- [x] 10.1 Use `playwright-cli open http://localhost:4000/home` and take a snapshot at default (desktop) viewport. Confirm: sidebar visible with distinct background, content fills width, no black margins. Verification: snapshot shows no obvious layout gaps.
- [x] 10.2 Resize to 375px width (or use `playwright-cli` with mobile viewport). Take snapshot of home page. Confirm: bottom nav visible, no horizontal scroll, content properly padded. Verification: snapshot looks correct on mobile.
- [x] 10.3 Take snapshot of `/collection` at 1440px and 375px. Confirm: card grid fills width on desktop; 2–3 columns on mobile; text legible. Verification: snapshots match expectations.
- [x] 10.4 Take snapshot of Chase Board tab at 1440px and 375px. Confirm: set rows span full width; thumbnails are larger on desktop; set names readable. Verification: snapshots confirm legibility.
- [x] 10.5 Take snapshot of `/search` at 1440px. Confirm: results grid fills width. Verification: no wasted black space.

## 11. Security Review

- [x] 11.1 Run `security-secure-coding` skill check. Confirm no new XSS vectors introduced (no `dangerouslySetInnerHTML`, no unescaped user content in new markup). Verification: security check passes with no findings.

## 12. Branch, PR, and Documentation

- [x] 12.1 Create feature branch: `git checkout main && git fetch origin && git pull origin main && git checkout -b feat/responsive-layout-and-ui-polish`. Verification: `git branch` shows new branch checked out.
- [ ] 12.2 Stage and commit all changes with message `feat(ui): responsive layout, sidebar polish, and space management`. Verification: `git status` clean after commit.
- [x] 12.3 Document any new gotchas discovered during implementation in `AGENTS.md` > Project Learnings, and mirror in `CLAUDE.md`. Verification: both files updated in same commit.
- [ ] 12.4 Create PR via `gh pr create`. Verification: PR URL returned, status shows open.
