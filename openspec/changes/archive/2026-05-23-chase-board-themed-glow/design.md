## Context

The home dashboard (`ui/src/routes/(app)/home/+page.svelte`) currently renders collection stats and the Chase Board sequentially. The Chase Board uses a fixed-height (128 px) horizontal-scroll strip with a plain indigo left rail. The reference design (`resources/chase-board/D _ Themed Glow.png`) shows a tabbed home page where the Chase Board lives in its own tab, each set panel has a distinct era-based color on the left rail, cards wrap into a grid, and hovering a card triggers a 3D tilt and a rarity-specific color glow. All changes are purely frontend; no backend work is required.

## Goals / Non-Goals

**Goals:**
- Add a two-tab UI ("Overview" / "Chase Board") at the top of `/home`, defaulting to Overview.
- Redesign each Chase Board set panel: themed gradient left rail, centered logo, count pill, flex-wrap card grid.
- Add card-level hover effects: CSS 3D tilt (`perspective + rotateY/rotateX`), rarity glow (radial gradient via `--glow` CSS var), and a one-shot shine sweep (`translateX` animation).
- Match logo centering to the reference design (both axes, `object-fit: contain`).

**Non-Goals:**
- No backend changes, no new API endpoints, no DB migrations.
- No changes to collection stats, quick actions, or auth flow.
- No new npm dependencies.
- No changes to `CardModal.svelte` or the card holo effect system.

## Decisions

### Tab state — URL param vs. local reactive variable
**Decision:** Use a local Svelte reactive variable (`let activeTab: 'overview' | 'chase' = 'overview'`).
**Rationale:** The tab selection is ephemeral UI state; there is no need to persist it across navigations or share it via URL. A URL query param would require `goto()` calls, add router coupling, and complicate SSR. For a two-tab toggle, a plain reactive variable is the simplest correct approach.
**Alternative considered:** `?tab=chase` query param — rejected because it adds URL noise and router coupling for no user benefit.

### Themed color — curated map vs. dynamic extraction
**Decision:** Use a curated `SET_THEME` map keyed on the `setId` prefix (e.g., `"base"` → crimson, `"neo"` → deep blue, `"hgss"` → gold-blue, `"swsh"` → cyan, default → indigo).
**Rationale:** Dynamic color extraction from set logos (canvas pixel-sampling) would require async work per panel and is error-prone for small/transparent logos. A curated map produces predictable, visually intentional results. Unknown sets fall back to the existing indigo gradient.
**Alternative considered:** CSS `color-scheme` detection from logo — rejected for complexity and fragility.

### Card layout — flex-wrap grid vs. horizontal scroll
**Decision:** Switch from a fixed-height horizontal-scroll strip to a `flex-wrap` grid with no height cap.
**Rationale:** The reference design shows cards wrapping to multiple rows when the set has many cards (e.g., Neo Genesis with 24+ cards). The current single-row strip hides most cards behind a scroll gesture. Wrapping surfaces all cards immediately. Panel height becomes dynamic.
**Alternative considered:** CSS Grid with fixed columns — flex-wrap is simpler and naturally adapts to varying card counts.

### Rarity glow — CSS custom property via `data-rarity`
**Decision:** Set `--glow` on each `.chase-thumb` via a small `rarityGlow(rarity: string): string` helper that maps rarity strings to rgba colors. Applied as `style="--glow: {rarityGlow(entry.cardSnapshot.rarity)}"`.
**Rationale:** Matches the pattern already established by the `data-rarity` attribute system in `Card.svelte`. Keeps glow logic in one function, easy to extend.

### Shine sweep — CSS-only transition
**Decision:** Implement the shine sweep with a `::after` pseudo-element using `translateX(-100%)` → `translateX(100%)` on `:hover`, no JS required.
**Rationale:** Pure CSS is sufficient; no interaction state needs to be tracked.

## Risks / Trade-offs

- [Panel height variability] Sets with many cards produce tall panels → Mitigation: cap panel at `max-height: 400px` with `overflow-y: auto` inside `.chase-cards-row` for very large sets.
- [SET_THEME map coverage] New sets not in the map get the indigo fallback → Mitigation: fallback is visually consistent; map can be extended over time.
- [Tilt + `overflow: hidden` clipping] Per the project gotcha, `overflow: hidden` on a parent of a tilting element causes invisible-frame clipping → Mitigation: do not apply `overflow: hidden` on any ancestor of `.chase-thumb`; rely on `border-radius` directly on `<img>`.

## Migration Plan

Single-file frontend change. No migration steps. Rollback = revert the `+page.svelte` changes.

## Open Questions

- Should the tab selection be remembered across page navigations (e.g., via `sessionStorage`)? → Defaulting to **no** for now; can be added later if users request it.
- Should the `SET_THEME` map be extracted to a shared utility for reuse elsewhere? → Defaulting to **inline in the component** for now (no other consumer exists).
