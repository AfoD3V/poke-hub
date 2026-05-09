## ADDED Requirements

### Requirement: Black/Red design token system
The UI SHALL use a pure-black background palette with Pokéball Red as the sole accent colour. All purple-family tokens (`ph-purple`, `ph-purple-light`, `ph-border-accent`) SHALL be removed and replaced. The Tailwind config SHALL define:
- `ph-bg: #000000`
- `ph-surface: #111111`
- `ph-card: #161616`
- `ph-border: rgba(255,255,255,0.04)`
- `ph-accent: #E3000B`
- `ph-accent-dim: rgba(227,0,11,0.15)`
- `ph-red-glow: rgba(227,0,11,0.35)`
- `ph-text: #FFFFFF`
- `ph-muted: #707070`

#### Scenario: No purple tokens remain in the codebase
- **WHEN** a developer runs `grep -r "ph-purple" ui/src`
- **THEN** no matches are returned

#### Scenario: Accent colour renders red
- **WHEN** any element uses the `bg-ph-accent` or `text-ph-accent` class
- **THEN** it renders as Pokéball Red (#E3000B)

#### Scenario: Background is pure black
- **WHEN** the app layout renders
- **THEN** the root background colour is #000000 (no purple tint)

### Requirement: Geist as the sole typeface
The UI SHALL load Geist (weights 400–900) and apply it as the global `font-family`. Syne and DM Sans SHALL be removed from all font imports and Tailwind config. The Tailwind `fontFamily.sans` SHALL default to `['Geist', 'sans-serif']`.

#### Scenario: Geist loads on page render
- **WHEN** the app HTML is served
- **THEN** a Google Fonts or Fontsource link for Geist is present in `<head>`

#### Scenario: No Syne or DM Sans references remain
- **WHEN** a developer runs `grep -r "Syne\|DM Sans\|font-syne\|font-dm" ui/src`
- **THEN** no matches are returned

#### Scenario: Headings render at 900 weight
- **WHEN** an `<h1>` element uses the heading style class
- **THEN** it renders with `font-weight: 900` in Geist

### Requirement: Red accent on primary interactive elements
All primary buttons, active nav states, and primary CTAs SHALL use `ph-accent` (#E3000B) as background or border, with white text. No element SHALL use purple as an interactive state colour.

#### Scenario: Primary button colour
- **WHEN** a `btn-primary` element renders
- **THEN** its background is #E3000B and text is #FFFFFF

#### Scenario: Active sidebar nav item
- **WHEN** a nav link matches the current route
- **THEN** it has a red left border accent and white text (no purple background fill)

#### Scenario: Add to Collection button
- **WHEN** the card modal add button renders in idle state
- **THEN** its accent colour is red, not purple
