## ADDED Requirements

### Requirement: Chase card database schema
The system SHALL persist chase cards in a `userChaseCards` table with columns: `id` (UUID PK), `userId` (FK → users, cascade delete), `cardId` (text), `cardSnapshot` (JSONB — stores `{ name, setName, setId, imageSmall }` for offline rendering), `addedAt` (timestamptz). The combination of `(userId, cardId)` MUST be unique.

#### Scenario: Chase table created on migration
- **WHEN** the database migration runs
- **THEN** a `userChaseCards` table exists with the specified columns and a unique constraint on `(userId, cardId)`

### Requirement: Backend chase API
The system SHALL expose authenticated REST endpoints under `/api/chase/*`:
- `GET /api/chase` → returns `{ entries: ChaseEntry[] }` for the authenticated user
- `POST /api/chase/add` → accepts `{ cardId: string, cardSnapshot: CardSnapshot }`, inserts a row (or no-ops if duplicate), returns 201 with the created entry
- `DELETE /api/chase/remove` → accepts `{ cardId: string }`, removes the row, returns 200 or 404

#### Scenario: Fetch empty chase list
- **WHEN** an authenticated user with no chased cards calls `GET /api/chase`
- **THEN** the response is `{ entries: [] }` with status 200

#### Scenario: Add a chase card
- **WHEN** an authenticated user POSTs `{ cardId: "sv1-001", cardSnapshot: { name: "Weedle", ... } }` to `/api/chase/add`
- **THEN** a row is inserted and the response is 201 with `{ entry: { id, userId, cardId, cardSnapshot, addedAt } }`

#### Scenario: Duplicate add is idempotent
- **WHEN** a user adds the same cardId twice
- **THEN** the second call returns 201 with the existing entry (no duplicate row)

#### Scenario: Remove a chased card
- **WHEN** an authenticated user sends `DELETE /api/chase/remove` with `{ cardId: "sv1-001" }`
- **THEN** the row is deleted and the response is 200 with `{ success: true }`

#### Scenario: Remove a card not in chase list returns 404
- **WHEN** a user tries to remove a cardId that is not in their chase list
- **THEN** the response is 404 with `{ error: "Not found" }`

### Requirement: Chase card toggle in CardModal
The system SHALL display a "Chase" toggle button in `CardModal.svelte` alongside the "Add to Collection" button. The button SHALL show filled/active state if the card is currently in the user's chase list, and empty/inactive state otherwise. Clicking it SHALL add or remove the card from the chase list via the `/api/chase/*` endpoints.

#### Scenario: Chase button shows inactive state by default
- **WHEN** a card modal opens and the card is not in the user's chase list
- **THEN** the chase button displays an unfilled icon with label "Chase"

#### Scenario: Chase button shows active state for chased card
- **WHEN** a card modal opens and the card is already in the chase list
- **THEN** the chase button displays a filled/highlighted icon with label "Chasing"

#### Scenario: User adds a chase card from modal
- **WHEN** user clicks the inactive Chase button
- **THEN** the button transitions to active ("Chasing") state and the card is persisted to the chase list

#### Scenario: User removes a chase card from modal
- **WHEN** user clicks the active Chase button ("Chasing")
- **THEN** the button transitions back to inactive ("Chase") state and the card is removed from the chase list

### Requirement: Chase board on home dashboard
The system SHALL display a "Chase Board" section on the home dashboard that groups chased cards by their set name. Each group SHALL show the set name and a horizontal strip of card thumbnails. The section SHALL only appear when the user has at least one chased card.

#### Scenario: Chase board hidden with empty chase list
- **WHEN** the user has no chased cards
- **THEN** the Chase Board section is not rendered on the home page

#### Scenario: Chase board shows cards grouped by set
- **WHEN** the user has chased cards from multiple sets
- **THEN** each set appears as a group with the set name and thumbnails of chased cards in that set

#### Scenario: Clicking a chased card thumbnail opens CardModal
- **WHEN** the user clicks a card thumbnail in the Chase Board
- **THEN** the CardModal opens for that card with the Chase button showing active state
