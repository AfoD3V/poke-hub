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
