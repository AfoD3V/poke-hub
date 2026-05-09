## Context

PokeHub is a SvelteKit 4 + Tailwind CSS monorepo. The UI package (`ui/`) uses:
- **Current tokens**: purple/graphite palette (`#07071a` bg, `#7c3aed` accent), Syne + DM Sans fonts
- **Current card tilt**: hand-rolled spring stores (`svelte/motion`) in `Card.svelte` and `CardModal.svelte`
- **Current modal layout**: flex row — `flip-shadow-wrap` (fixed width) + `info-panel` (flex-1), both siblings in `.modal-layout`
- **Resources available**: `resources/pokemon-cards-css/` (canonical holo CSS) and `resources/hover-tilt/` (production HoverTilt Svelte 5 component)

The holo rarity CSS system is already correct and must not be disturbed. The problem is purely visual design (colors, typography, density) and the card modal's spatial composition.

## Goals / Non-Goals

**Goals:**
- Replace all purple tokens with a pure-black / Pokéball-Red (`#E3000B`) system
- Load Geist as the sole typeface (weight 400–900); remove Syne and DM Sans
- Make the card modal card feel like a free-floating 3D physical object (no framing artifacts)
- Integrate `HoverTilt` (Svelte 4 adapted) for spring tilt on grid cards and modal card
- Increase card grid density
- Redesign auth pages and sidebar to match new design language
- Keep all rarity holo effects (`data-rarity` CSS) completely intact

**Non-Goals:**
- Backend / API changes
- New features (search filters, collection sorting, etc.)
- Mobile-responsive redesign (mobile is best-effort, not primary target)
- Replacing the flip animation mechanism

## Decisions

### D1: Token naming — keep existing names, change values
**Decision**: Keep `ph-bg`, `ph-surface`, `ph-card`, `ph-border`, `ph-text`, `ph-muted` names. Replace `ph-purple` / `ph-purple-light` with `ph-accent` / `ph-accent-dim`. Add `ph-red-glow`.

**Rationale**: Minimises find/replace blast radius. Only the purple-specific names need renaming — all other token names stay valid.

**Alternative considered**: Rename everything (e.g. `ph-bg` → `ph-black`). Rejected — too many callsites, no semantic gain.

### D2: Font loading — Google Fonts CDN link in `app.html`
**Decision**: Add a `<link>` preconnect + stylesheet for Geist from Google Fonts in `ui/src/app.html`. Apply globally via `font-family: 'Geist', sans-serif` in `app.css` body rule and Tailwind `fontFamily.sans` override.

**Rationale**: Zero npm install, no build-step change, CDN caching. `@fontsource/geist` is an alternative but adds a dependency and requires CSS imports in the bundle.

**Alternative considered**: `@fontsource/geist` npm package. Rejected for simplicity — CDN is fine for this project.

### D3: HoverTilt — copy and adapt to Svelte 4, do not use as npm package
**Decision**: Copy `resources/hover-tilt/packages/hover-tilt/src/lib/components/HoverTilt.svelte` to `ui/src/lib/components/HoverTilt.svelte`, manually converting Svelte 5 rune syntax to Svelte 4 (`$props` → `export let`, `$state` → `let`, `$derived` → `$:`, `Spring` from `svelte/motion` → `spring`).

**Rationale**: The project uses Svelte 4. Svelte 5 runes (`$props`, `$derived`, `Spring` class) are incompatible. A local copy is easier to maintain than a fork, and the component is small enough to adapt.

**Key adaptation points**:
- `$props()` destructure → individual `export let` declarations
- `new Spring(value, opts)` → `spring(value, opts)` + `$` prefix for reading
- `$derived(...)` → `$: ...` reactive statements
- `$state<T>` → typed `let` variable
- `onpointermove` / `onpointerenter` / `onpointerleave` → `on:pointermove` etc.

### D4: Card modal — floating card via absolute positioning + overlay info panel
**Decision**: Remove the `.modal-layout` flex row. Instead:
1. The card (`flip-shadow-wrap`) is centered in the overlay with `position: absolute; top: 50%; left: 38%; transform: translate(-50%, -50%)`  — shifted slightly left to make room for the info panel.
2. The info panel is `position: absolute; right: 5%; top: 50%; transform: translateY(-50%)` — a floating aside with `background: rgba(17,17,17,0.92)` and `backdrop-filter: blur(20px)`.
3. The `.overlay` keeps `position: fixed; inset: 0` with click-to-close on backdrop.

**Rationale**: A flex sibling forces both elements into the same formatting context, which subtly clips the 3D perspective of the card and makes it look "in a box". Absolute positioning lets the card's perspective and drop-shadow extend freely in all directions without being bounded by a flex container.

**Known constraint**: `filter: drop-shadow(...)` on `flip-shadow-wrap` is safe because `flip-shadow-wrap` has no `transform-style: preserve-3d`. The `flip-wrap` child carries `preserve-3d`.

### D5: Card tilt in modal — use existing spring interact logic, not HoverTilt
**Decision**: Keep the hand-rolled `springRotate` / `springGlare` / `springBg` tilt in `CardModal.svelte` (do not wrap modal card in HoverTilt). Apply HoverTilt only in grid `Card.svelte`.

**Rationale**: The modal card tilt must coordinate with the flip animation — the same card element drives both. HoverTilt wraps its child in a div that would disrupt the `face--front` / `face--back` `backface-visibility` structure. The existing modal spring logic is correct; the layout problem (not the tilt math) is what makes it feel wrong.

### D6: Default card glow — change fallback to Pokéball Red
**Decision**: In `Card.svelte` and `CardModal.svelte`, change the default `--card-glow` from `hsl(215, 90%, 70%)` (blue) to `hsl(0, 90%, 44%)` (red). Keep all type-specific overrides (water, fire, grass, etc.) unchanged.

**Rationale**: The blue default glow is a leftover from the original purple palette. Red aligns with the new accent system without impacting type-specific cards.

## Risks / Trade-offs

- **Geist via CDN requires network on first load** → Mitigation: add `font-display: swap` via the CDN URL parameter; offline use is not a product requirement.
- **HoverTilt Svelte 4 adaptation may miss edge cases** → Mitigation: run `bun run check` in `ui/` after adaptation; the adapted file is small and the conversion is mechanical.
- **Absolute-positioned modal info panel may clip on small screens** → Mitigation: add a `@media (max-width: 680px)` fallback that returns to column stacking (same as current behaviour).
- **All purple token consumers must be updated** → Mitigation: `grep -r "ph-purple" ui/src` to find all callsites; none should remain after the change.
- **Geist font name in Google Fonts**: Verify exact URL / family name before implementation — Google added Geist in 2024 but the exact import string must be confirmed.

## Migration Plan

1. Update `tailwind.config.ts` tokens first — this causes visible breakage (missing classes) until consumers are updated, so do in a single commit with all consumer updates.
2. Update `app.html` font import + `app.css` body font rule.
3. Update all Svelte files (sidebar, auth, layout, pages) to use new token names.
4. Create `HoverTilt.svelte` adapted file.
5. Update `Card.svelte` to use HoverTilt + new tokens.
6. Redesign `CardModal.svelte` (floating layout + new tokens).
7. Run `bun run lint && bun run check && bun run test` — fix any failures.
8. Visual verify via `playwright-cli snapshot`.

**Rollback**: All changes are in `ui/` only. Revert the feature branch; no DB migrations involved.

## Open Questions

- **Geist on Google Fonts**: Is the family name `"Geist"` or `"Geist Sans"`? Confirm before writing `app.html`.
- **Info panel width on modal**: Should the info panel width be fixed (e.g. 280px) or percentage-based? Suggest fixed for predictability.
- **HoverTilt in Card.svelte — does it conflict with the existing `data-rarity` CSS variable approach?** HoverTilt uses its own `--hover-tilt-*` CSS variables; the holo system uses `--pointer-x`, `--rotate-x` etc. They are independent namespaces — no conflict expected, but verify after integration.
