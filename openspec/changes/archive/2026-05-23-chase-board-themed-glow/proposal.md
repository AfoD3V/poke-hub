## Why

The home dashboard currently places the Chase Board inline below collection stats with a plain indigo left rail, generic hover styling, and no visual differentiation between sets. The reference design introduces a themed-glow system where each set panel self-tints with a signature color, cards get rarity-appropriate glows and 3D tilt on hover, and the Chase Board moves to its own tab — making the page feel like a premium collector's showcase rather than a plain list.

## What Changes

- Add a **tab bar** at the top of the home dashboard with two tabs: **Overview** (existing stats + quick actions) and **Chase Board** (the chase section, moved here from inline).
- Redesign each chase-set panel with a **themed left rail** whose gradient color is derived from the set's era/signature color palette (computed from the set's `setId` prefix or a curated map).
- Switch the card strip layout from a **single horizontal scroll row** to a **flex-wrap grid** that expands vertically within the panel.
- Add **rarity glow** (`--glow` CSS variable) and **3D tilt** (perspective `rotateY`/`rotateX` on hover) to each card thumbnail in the Chase Board.
- Add a **count pill** (e.g., "· 3 cards") below the set name in the logo rail.
- Ensure the set **logo is centered** (both axes) within the logo rail, matching the reference design.
- Add a **shine sweep** animation on card hover.

## Capabilities

### New Capabilities
- `home-dashboard-tabs`: Tab navigation on `/home` splitting Overview and Chase Board into distinct views.

### Modified Capabilities
- `home-dashboard`: Chase Board section moves out of the inline flow and into a dedicated tab; tab bar UI is added.
- `chase-cards`: Chase Board panel redesign — themed left rail, flex-wrap card grid, rarity glow, tilt, shine sweep, count pill, centered logo.

## Impact

- `ui/src/routes/(app)/home/+page.svelte` — primary file: tabs, panel redesign, new CSS.
- No backend changes; no schema changes; no new routes.
- Visual regression: existing Chase Board layout is replaced entirely.
