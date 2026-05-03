## ADDED Requirements

### Requirement: Search UI results grid
The frontend SHALL provide a search interface that queries the proxy and renders results as a grid of cards.

#### Scenario: Successful search
- **WHEN** a user submits a Pokemon name
- **THEN** the UI renders matching cards in a grid layout

### Requirement: Holographic card effects
Search results SHALL render using pokemon-cards-css with cursor-tracking holographic effects.

#### Scenario: Hovering over a card
- **WHEN** a user moves the cursor over a rendered card
- **THEN** the holographic effect responds to cursor position

### Requirement: Loading and error states
The search UI MUST display loading and error states during proxy requests.

#### Scenario: Request in flight
- **WHEN** a search request is pending
- **THEN** the UI shows a loading state

#### Scenario: Request failure
- **WHEN** a search request fails
- **THEN** the UI shows an error state
