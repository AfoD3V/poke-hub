## MODIFIED Requirements

### Requirement: Chase board on home dashboard
The system SHALL display a "Chase Board" section (within the Chase Board tab) that groups chased cards by their set name. Each group SHALL be rendered as a panel with:
- A **themed left rail** whose gradient color is derived from a curated `SET_THEME` map keyed on `setId` prefix (e.g., `"base"` → crimson, `"neo"` → deep blue, `"hgss"` → gold-blue, `"swsh"` → cyan, default → indigo). The left rail background SHALL use a `linear-gradient` of the themed color.
- A **set logo** centered both horizontally and vertically within the left rail, rendered with `object-fit: contain`.
- A **set name** label below the logo (uppercase, small, muted).
- A **count pill** below the set name showing "· N cards" where N is the number of chased cards in that set.
- A **flex-wrap card grid** on the right side of the panel where cards wrap to multiple rows as needed (not a fixed-height horizontal-scroll strip).

Each card thumbnail in the grid SHALL support the following hover effects:
- **3D tilt**: `perspective(800px) rotateY(-6deg) rotateX(4deg) translateY(-8px) scale(1.04)` on hover.
- **Rarity glow**: a radial gradient `::before` pseudo-element behind the card using a `--glow` CSS variable set per card based on rarity (e.g., Secret Rare → gold, Ultra Rare → purple, Holo Rare → blue, default → white/50%).
- **Shine sweep**: a `::after` pseudo-element that sweeps `translateX(-100%)` → `translateX(100%)` on hover.

Clicking a card thumbnail SHALL open the CardModal for that card.

#### Scenario: Chase board shows cards grouped by set with themed rail
- **WHEN** the user opens the Chase Board tab and has chased cards from multiple sets
- **THEN** each set appears as a panel with a themed-color left rail and the set logo centered within it

#### Scenario: Count pill shows correct card count
- **WHEN** a set panel is rendered with N chased cards
- **THEN** the count pill displays "· N cards"

#### Scenario: Cards wrap to multiple rows for large sets
- **WHEN** a set has more cards than fit in a single row at the current viewport width
- **THEN** cards wrap to additional rows within the panel (no horizontal scroll)

#### Scenario: Card thumbnail 3D tilt on hover
- **WHEN** the user hovers over a card thumbnail
- **THEN** the card tilts with a perspective 3D transform (rotateY + rotateX + scale)

#### Scenario: Rarity glow appears on hover
- **WHEN** the user hovers over a card thumbnail that has a known rarity
- **THEN** a colored glow matching the card's rarity appears behind the card

#### Scenario: Shine sweep plays on hover
- **WHEN** the user hovers over a card thumbnail
- **THEN** a light diagonal shine sweeps across the card image

#### Scenario: Unknown set falls back to default indigo rail
- **WHEN** a set panel has a setId not present in the SET_THEME map
- **THEN** the left rail renders with the default indigo gradient

#### Scenario: Clicking a chased card thumbnail opens CardModal
- **WHEN** the user clicks a card thumbnail in the Chase Board
- **THEN** the CardModal opens for that card with the Chase button showing active state
