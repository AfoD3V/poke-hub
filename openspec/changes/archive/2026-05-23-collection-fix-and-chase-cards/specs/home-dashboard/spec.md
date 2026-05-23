## MODIFIED Requirements

### Requirement: Collection statistics displayed on home dashboard
The system SHALL display a collection statistics section on the home dashboard. The section SHALL include:
- Total cards owned (sum of quantities)
- Unique Pokémon (unique card names)
- Cards per set: a list of sets represented in the collection, each showing set name, card count, and percentage of total
- Rarity breakdown: count of cards per rarity tier (Common, Uncommon, Rare, Holo Rare, Ultra Rare, Secret Rare / Special)

The stats SHALL be computed server-side in the `+page.server.ts` load function from the collection entries already fetched via `GET /api/collection`.

#### Scenario: Empty collection shows zero stats
- **WHEN** the user has no cards in their collection
- **THEN** all stats show 0 and the per-set list is empty

#### Scenario: Stats reflect collection contents
- **WHEN** the user has cards from multiple sets and rarities
- **THEN** total cards, unique Pokémon, per-set counts, and rarity breakdown all match the actual collection data

#### Scenario: Per-set list sorted by card count descending
- **WHEN** the collection contains cards from multiple sets
- **THEN** sets are listed with the most-owned set first

## ADDED Requirements

### Requirement: Chase Board section on home dashboard
The system SHALL render a "Chase Board" section on the home dashboard below the collection stats. Requirements are defined in the `chase-cards` spec.

#### Scenario: Chase Board section appears only when chase list is non-empty
- **WHEN** the user has at least one chased card
- **THEN** a "Chase Board" section is visible on the home page

#### Scenario: Chase Board section is hidden when chase list is empty
- **WHEN** the user has no chased cards
- **THEN** no "Chase Board" section is rendered on the home page
