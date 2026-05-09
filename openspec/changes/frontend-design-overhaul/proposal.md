## Why

The current PokeHub frontend uses a purple/graphite dark theme with Syne + DM Sans fonts that reads as generic AI-generated UI. The card detail modal renders the holographic card inside a constrained flex container, breaking the "floating physical object" illusion that is central to the product's premium feel. The design needs to be replaced with a sharp, opinionated black-and-red system inspired by high-end dark design tools.

## What Changes

- **Design tokens**: Replace all purple (`#07071a`, `#7c3aed`, `#a78bfa`) with a pure-black/Pokéball-Red (`#000000`, `#E3000B`) palette across Tailwind config and all component styles
- **Typography**: Swap Syne + DM Sans entirely for Geist (weight 400–900); apply ultra-bold (900) headings sitewide
- **Sidebar**: Remove purple tints; add a red left-border active indicator; make the wordmark "Poke**Hub**" with red "Hub"; borderless separation via shadow only
- **Auth pages**: Full-bleed black background; large heavy "PokeHub" wordmark above form; solid red primary button; borderless-feel inputs
- **App layout**: Pure black background; remove sidebar border
- **Card component**: Integrate `HoverTilt.svelte` (Svelte-4-adapted copy of `resources/hover-tilt`) for tilt motion; denser grid; Geist card labels
- **Card modal** (**BREAKING UX — highest priority**): Redesign so the card floats freely as a 3D object rather than sitting inside a framed flex container; info panel becomes a floating aside; fix weird tilt behaviour in maximized state
- **Collection, Home, Search pages**: Apply new tokens, dense grid, Geist headings, red accents

## Capabilities

### New Capabilities

- `design-system`: New black/red Tailwind token set + Geist font applied globally
- `hover-tilt`: Svelte-4 adaptation of the `hover-tilt` library integrated as a shared component (`ui/src/lib/components/HoverTilt.svelte`)
- `card-modal-3d`: Redesigned card detail modal where the card is a free-floating 3D object with correct perspective, no container clipping, and a slide-in info panel

### Modified Capabilities

- `card-holo-effects`: Rarity CSS effects are preserved but card glow default changes from blue to Pokéball Red; all `data-rarity` selectors remain untouched

## Impact

- `ui/tailwind.config.ts` — token names change; all consumers updated
- `ui/src/app.html` / `ui/src/app.css` — font import changes (Geist via `@fontsource/geist` or CDN)
- `ui/src/lib/components/Card.svelte` — tilt logic replaced with HoverTilt wrapper
- `ui/src/lib/components/CardModal.svelte` — major layout restructure
- `ui/src/lib/components/Sidebar.svelte` — visual overhaul
- `ui/src/lib/components/HoverTilt.svelte` — new file (adapted from resources)
- `ui/src/routes/(app)/+layout.svelte`, `home/+page.svelte`, `collection/+page.svelte`, `search/+page.svelte` — token updates
- `ui/src/routes/auth/` — full auth page redesign
- No backend / API changes
- No new npm dependencies beyond `@fontsource/geist` (or CDN — no install needed)
