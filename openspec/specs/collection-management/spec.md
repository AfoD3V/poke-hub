## MODIFIED Requirements

### Requirement: Collection page does not render its own navigation bar
The collection page SHALL NOT render an inline top navbar. Navigation is provided exclusively by the shared sidebar from the app shell layout.

#### Scenario: No inline navbar on collection page
- **WHEN** an authenticated user visits `/collection`
- **THEN** no `<header>` element with inline nav links SHALL be present inside the collection page component itself
- **AND** the sidebar from the app shell SHALL be the sole navigation element

#### Scenario: Collection functionality is unchanged
- **WHEN** an authenticated user visits `/collection`
- **THEN** the card grid, remove buttons, empty state, and card modal SHALL all function identically to before

## ADDED Requirements

### Requirement: Add to collection
The backend SHALL provide `POST /api/collection/add` to save a card to a user's collection.

#### Scenario: Adding a card
- **WHEN** an authenticated user submits a valid card payload
- **THEN** the card is saved in `user_collection`

### Requirement: Remove from collection
The backend SHALL provide `DELETE /api/collection/remove` to remove a card from a user's collection.

#### Scenario: Removing a card
- **WHEN** an authenticated user requests removal for a saved card
- **THEN** the card is removed from `user_collection`

### Requirement: Collection dashboard
The frontend SHALL provide a My Collection dashboard that lists the user's saved cards.

#### Scenario: Viewing collection
- **WHEN** an authenticated user visits the My Collection page
- **THEN** saved cards are displayed in a grid with holographic effects
