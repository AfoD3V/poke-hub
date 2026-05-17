## 1. Tests (write failing tests first)

- [x] 1.1 In `ui/src/tests/home.test.ts`, add a test asserting the "Overview" tab is rendered and active by default on `/home`.
  - *Verification: `bun run test` in `ui/` shows 1 new failing test.*
- [x] 1.2 Add a test asserting the "Chase Board" tab is rendered and clicking it hides stats and shows chase content.
  - *Verification: `bun run test` in `ui/` shows additional failing tests.*
- [x] 1.3 Add a test asserting that when chase entries exist, the Chase Board tab badge shows the correct count.
  - *Verification: `bun run test` in `ui/` shows the badge test failing.*
- [x] 1.4 Add a test asserting the empty-state message appears when the Chase Board tab is active and there are no chase entries.
  - *Verification: `bun run test` in `ui/` shows the empty-state test failing.*

## 2. Tab Navigation

- [x] 2.1 Add `let activeTab: 'overview' | 'chase' = 'overview'` reactive state to `+page.svelte`.
  - *Verification: No TypeScript errors after adding the variable.*
- [x] 2.2 Render the tab bar above the existing content: two `<button>` elements ("Overview" / "Chase Board") with ARIA roles (`role="tab"`, `aria-selected`). Style the active tab with an accent underline.
  - *Verification: `playwright-cli snapshot` shows two visible tabs on `/home`.*
- [x] 2.3 Add a numeric badge to the "Chase Board" tab showing `data.chaseEntries?.length` when > 0.
  - *Verification: Badge shows correct count in snapshot.*
- [x] 2.4 Wrap the collection stats + quick-actions section in `{#if activeTab === 'overview'}`.
  - *Verification: Clicking "Chase Board" tab hides stats in snapshot.*
- [x] 2.5 Wrap the Chase Board content in `{#if activeTab === 'chase'}`.
  - *Verification: Clicking "Overview" tab hides chase panels in snapshot.*
- [x] 2.6 Add an empty-state message (`<p>No cards on your Chase Board yet.</p>`) inside the `activeTab === 'chase'` block, shown only when `chaseEntries.length === 0`.
  - *Verification: Empty-state visible in snapshot when no chase cards.*

## 3. Chase Board Panel Redesign

- [x] 3.1 Add the `SET_THEME` map as a `const` in `<script>`: keyed on `setId` prefix with entries for `base`, `jungle`, `fossil`, `neo`, `hgss`, `bw`, `xy`, `sm`, `swsh`, `sv`. Each entry is `{ from: string, to: string }` CSS color stops for the left-rail `linear-gradient`.
  - *Verification: TypeScript compiles cleanly.*
- [x] 3.2 Add a `railGradient(setId: string): string` helper that returns `linear-gradient(180deg, {from} 0%, {to} 100%)` using the SET_THEME map, falling back to the indigo default.
  - *Verification: Function returns correct gradient string for known and unknown setIds.*
- [x] 3.3 Add a `rarityGlow(rarity: string | undefined): string` helper returning an rgba color string: Secret Rare → gold (`rgba(251,191,36,0.6)`), Ultra Rare → purple (`rgba(168,85,247,0.6)`), Holo Rare → blue (`rgba(96,165,250,0.6)`), default → `rgba(255,255,255,0.35)`.
  - *Verification: Function returns correct colors for each rarity tier.*
- [x] 3.4 Update each `.chase-set-card` panel to pass `style="background: {railGradient(setId)}"` on the `.chase-set-identity` element.
  - *Verification: Playwright screenshot shows distinct colors per set panel.*
- [x] 3.5 Add the count pill below the set name: `<span class="chase-count-pill">· {entries.length} card{entries.length === 1 ? '' : 's'}</span>`.
  - *Verification: Snapshot shows pill with correct count under set name.*
- [x] 3.6 Ensure the set logo `<img>` has `object-fit: contain` and is centered both axes in the left rail (update CSS: `align-items: center; justify-content: center` on `.chase-set-identity`).
  - *Verification: Playwright screenshot confirms centered logo.*
- [x] 3.7 Change `.chase-cards-strip` from a fixed-height horizontal-scroll row to `flex-wrap: wrap; overflow: visible; height: auto; padding: 16px;` so cards wrap into multiple rows.
  - *Verification: A set with many cards shows multiple rows in screenshot.*

## 4. Card Hover Effects

- [x] 4.1 Add the `--glow` CSS variable to each `.chase-thumb` via `style="--glow: {rarityGlow(entry.cardSnapshot.rarity)}"` in the template.
  - *Verification: CSS variable is set in DOM (inspect element or snapshot).*
- [x] 4.2 Add the rarity glow `::before` pseudo-element to `.chase-thumb` in `<style>`: `radial-gradient(closest-side, var(--glow, rgba(255,255,255,.35)) 0%, transparent 75%)`, `filter: blur(8px)`, `opacity: 0` → `1` on hover, `z-index: -1`.
  - *Verification: Glow visible in Playwright screenshot on hover (use `playwright-cli screenshot` after hovering).*
- [x] 4.3 Update `.chase-thumb:hover` to the 3D tilt transform: `perspective(800px) rotateY(-6deg) rotateX(4deg) translateY(-8px) scale(1.04)`. Remove the old `scale(1.07)` rule.
  - *Verification: Playwright screenshot shows tilt effect on hovered card.*
- [x] 4.4 Add the shine sweep `::after` pseudo-element on `.chase-thumb`: `background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.18) 50%, transparent 70%)`, `transform: translateX(-100%)` default, `translateX(100%)` on hover, `transition: transform .8s ease`, `pointer-events: none`.
  - *Verification: Shine sweep visible in Playwright screenshot.*
- [x] 4.5 Ensure no ancestor of `.chase-thumb` has `overflow: hidden` (per project gotcha). Remove `overflow: hidden` from `.chase-set-card` if present; use `border-radius` on `<img>` directly.
  - *Verification: 3D tilt is not clipped in screenshot.*

## 5. Quality Gates

- [x] 5.1 Run `bun run test` in `ui/` — all tests pass (green).
  - *Verification: Terminal output shows 0 failures.*
- [x] 5.2 Run `bun run check` in `ui/` — zero svelte-check errors.
  - *Verification: No TypeScript/Svelte type errors.*
- [x] 5.3 Run `bun run lint` from repo root — zero ESLint errors.
  - *Verification: Terminal output shows 0 errors.*
- [x] 5.4 Take a full Playwright screenshot of `/home` (Overview tab) and confirm no visual regressions.
  - *Verification: Human review of screenshot.*
- [x] 5.5 Take a Playwright screenshot of the Chase Board tab with multiple set panels — confirm themed rail colors, centered logos, count pills, wrapped cards.
  - *Verification: Human review of screenshot.*
- [x] 5.6 Run `security-secure-coding` skill and resolve all findings.
  - *Verification: No unresolved security findings.*
- [ ] 5.7 Create feature branch, push, open PR via `gh pr create`.
  - *Verification: `gh pr status` shows open PR.*
