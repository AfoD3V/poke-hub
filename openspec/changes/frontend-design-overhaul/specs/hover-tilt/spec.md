## ADDED Requirements

### Requirement: HoverTilt component available as shared UI primitive
A `HoverTilt.svelte` component SHALL exist at `ui/src/lib/components/HoverTilt.svelte`. It SHALL be adapted from `resources/hover-tilt/packages/hover-tilt/src/lib/components/HoverTilt.svelte` to use Svelte 4 syntax (`export let`, `spring()`, `$:` reactive). It SHALL expose the same props as the original: `tiltFactor`, `scaleFactor`, `springOptions`, `enterDelay`, `exitDelay`, `glareIntensity`, `glareHue`, `shadow`, `shadowBlur`.

#### Scenario: Component wraps slotted content with tilt
- **WHEN** a card image is slotted inside `<HoverTilt>`
- **THEN** moving the pointer over the card tilts it on X and Y axes using spring physics

#### Scenario: Svelte 4 syntax compiles without errors
- **WHEN** `bun run check` is run in `ui/`
- **THEN** `HoverTilt.svelte` produces zero TypeScript or Svelte errors

#### Scenario: Tilt resets on pointer leave
- **WHEN** the pointer leaves the HoverTilt element
- **THEN** the card springs back to its resting flat orientation

### Requirement: HoverTilt applied to collection grid cards
`Card.svelte` SHALL wrap the card image in `<HoverTilt>`. The existing hand-rolled spring tilt logic (`springRotate`, `springGlare`, `springBg`) in `Card.svelte` SHALL be replaced by HoverTilt for the tilt motion. The holo CSS variable system (`--pointer-x`, `--rotate-x`, etc.) SHALL continue to be fed by the card's own `interact` / `interactEnd` handlers (or by wiring HoverTilt's CSS variables to the holo system).

#### Scenario: Grid card tilts on hover via HoverTilt
- **WHEN** a user hovers over a card in the collection grid
- **THEN** the card tilts with a spring physics feel driven by HoverTilt

#### Scenario: Rarity holo effects still trigger on hover
- **WHEN** a user hovers over a rare-holo card
- **THEN** the colour-dodge shine and glare overlays activate alongside the tilt

#### Scenario: Card returns to flat on pointer leave
- **WHEN** the pointer leaves a grid card
- **THEN** the card animates back to 0° rotation with spring damping
