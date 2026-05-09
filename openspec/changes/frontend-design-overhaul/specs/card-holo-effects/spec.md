## MODIFIED Requirements

### Requirement: Default card glow uses Pokéball Red
The default `--card-glow` CSS variable in `Card.svelte` and `CardModal.svelte` SHALL be `hsl(0, 90%, 44%)` (Pokéball Red) instead of the previous `hsl(215, 90%, 70%)` (blue). All type-specific glow overrides (`.card.water`, `.card.fire`, `.card.grass`, etc.) SHALL remain unchanged and SHALL continue to take precedence over the default.

#### Scenario: Unknown/no-type card glows red
- **WHEN** a card with no `types` data is hovered
- **THEN** the card box-shadow glow colour is red (#E3000B range), not blue

#### Scenario: Water-type card still glows blue
- **WHEN** a water-type card is hovered
- **THEN** the card box-shadow glow colour is `hsl(192, 97%, 60%)` (water blue), not red

#### Scenario: Fire-type card still glows orange-red
- **WHEN** a fire-type card is hovered
- **THEN** the card box-shadow glow colour is `hsl(9, 81%, 59%)` (fire orange), not the default red

### Requirement: All rarity holo CSS selectors remain intact
The existing `data-rarity` CSS selectors for all rarity tiers (rare holo, cosmos holo, rare holo V, rare holo VMax, ultra rare, illustration rare, secret rare, rainbow rare, reverse holo, amazing rare) SHALL remain functionally identical. No `background-image`, `mix-blend-mode`, `filter`, or `clip-path` values for rarity effects SHALL be changed.

#### Scenario: Rare holo scanline effect active on hover
- **WHEN** a rare-holo card is hovered
- **THEN** the `.card__shine` shows the rainbow scanline pattern clipped to the art area

#### Scenario: Secret rare glitter effect active on hover
- **WHEN** a secret-rare card is hovered
- **THEN** the `.card__shine` shows the glitter/geometric gold effect

#### Scenario: Reverse holo inverted clip active on hover
- **WHEN** a reverse-holo card is hovered
- **THEN** the `.card__shine` applies to everything EXCEPT the art area (inverted clip-path)
