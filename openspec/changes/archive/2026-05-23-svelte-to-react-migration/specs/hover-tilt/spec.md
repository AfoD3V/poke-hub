## MODIFIED Requirements

### Requirement: HoverTilt component available as shared UI primitive
A `HoverTilt.tsx` component SHALL exist at `ui-react/src/lib/components/HoverTilt.tsx`. It SHALL expose the same props as the original Svelte component: `tiltFactor`, `scaleFactor`, `springOptions`, `enterDelay`, `exitDelay`, `glareIntensity`, `glareHue`, `shadow`, `shadowBlur`. It SHALL accept `children: React.ReactNode` (replacing Svelte's slot). It SHALL use the `useSpring` hook internally for physics.

#### Scenario: Component wraps children with tilt
- **WHEN** a card image is wrapped in `<HoverTilt>`
- **THEN** moving the pointer over the element tilts it on X and Y axes using spring physics

#### Scenario: TypeScript check passes
- **WHEN** `tsc --noEmit` is run in `ui-react/`
- **THEN** `HoverTilt.tsx` produces zero TypeScript errors

#### Scenario: Tilt resets on pointer leave
- **WHEN** the pointer leaves the HoverTilt element
- **THEN** the element springs back to its resting flat orientation

## MODIFIED Requirements

### Requirement: HoverTilt applied to collection grid cards
`Card.tsx` SHALL wrap the card image in `<HoverTilt>`. The holographic CSS variable system (`--pointer-x`, `--rotate-x`, etc.) SHALL continue to be updated by `Card.tsx`'s own `onPointerMove` handler independently of HoverTilt's tilt transform.

#### Scenario: Grid card tilts on hover via HoverTilt
- **WHEN** a user hovers over a card in the collection grid
- **THEN** the card tilts with spring physics driven by HoverTilt

#### Scenario: Rarity holo effects still trigger on hover
- **WHEN** a user hovers over a rare-holo card
- **THEN** the colour-dodge shine and glare overlays activate alongside the tilt

#### Scenario: Card returns to flat on pointer leave
- **WHEN** the pointer leaves a grid card
- **THEN** the card animates back to 0° rotation with spring damping
