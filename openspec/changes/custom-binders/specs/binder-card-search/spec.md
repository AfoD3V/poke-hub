## ADDED Requirements

### Requirement: Card search modal opens in binder context
The UI SHALL display a card-search modal when the user needs to assign a card to a slot. The modal SHALL have a title ("Add card"), a close button, and two tabs: "Cards" (search by name) and "Sets" (browse by set). The modal SHALL not affect the URL.

#### Scenario: Modal opens with Cards tab active by default
- **WHEN** the user triggers card assignment for a slot
- **THEN** the modal opens with the "Cards" tab active and the search input focused

#### Scenario: Modal closes on X button click
- **WHEN** the user clicks the close button
- **THEN** the modal closes and no card is assigned to the slot

#### Scenario: Modal closes on Escape key
- **WHEN** the modal is open and the user presses Escape
- **THEN** the modal closes without assignment

### Requirement: Cards tab — text search with autocomplete
The "Cards" tab SHALL contain a text input. As the user types (minimum 2 characters), the system SHALL display autocomplete suggestions (Pokémon names matching the query). Selecting a suggestion SHALL populate the search field and trigger a full search. The results SHALL render as a 3-column card grid with thumbnails. Each card SHALL show a zoom icon (preview) and an add icon (assign to slot).

#### Scenario: Typing triggers autocomplete
- **WHEN** the user types 2 or more characters into the card search input
- **THEN** a dropdown of matching Pokémon name suggestions appears below the input

#### Scenario: Selecting a suggestion runs the search
- **WHEN** the user clicks a suggestion in the dropdown
- **THEN** the dropdown closes, the input is populated with the suggestion, and the card grid shows results

#### Scenario: Search results render as 3-column grid
- **WHEN** the search returns results
- **THEN** cards are displayed in a 3-column grid with thumbnail images visible

#### Scenario: Clicking add icon assigns card to slot
- **WHEN** the user clicks the add icon on a card in the results grid
- **THEN** the modal closes and the selected card is assigned to the target slot

#### Scenario: No results state shown
- **WHEN** the search query returns no matching cards
- **THEN** the grid area displays an empty-state message (e.g. "No cards found")

#### Scenario: Empty input shows empty state, not results
- **WHEN** the search input is empty or has fewer than 2 characters
- **THEN** the grid area is empty (no results shown, no autocomplete)

### Requirement: Cards tab — set-code badge on results
Each card in the search results grid SHALL display the set code badge (e.g. "MEW", "SCR") in the bottom-right corner of the card thumbnail.

#### Scenario: Set code badge visible on each result
- **WHEN** search results are displayed
- **THEN** each card tile shows the set code badge

### Requirement: Sets tab — browse and select a set
The "Sets" tab SHALL display a searchable list of all available TCG sets. Each set item SHALL show the set logo, set code badge, and set name. Selecting a set SHALL replace the list view with a card grid for that set, where each card can be selected to assign to the slot.

#### Scenario: Sets tab shows full set list on open
- **WHEN** the user switches to the "Sets" tab
- **THEN** all available sets are listed with logo, code badge, and name

#### Scenario: Set search filters the list
- **WHEN** the user types in the set search input
- **THEN** only sets whose name matches the query are shown

#### Scenario: Selecting a set shows its cards
- **WHEN** the user clicks a set in the list
- **THEN** the view transitions to show cards from that set in a grid

#### Scenario: Card in set can be assigned to slot
- **WHEN** the user clicks the add icon on a card in the set card grid
- **THEN** the modal closes and the card is assigned to the target slot

### Requirement: Autocomplete uses existing TCG proxy
The autocomplete and search SHALL use the existing backend TCG proxy endpoints (`/api/cards/search`). No new external API calls SHALL be made from the client directly.

#### Scenario: Autocomplete calls API proxy
- **WHEN** the user types "bulb" in the search input
- **THEN** the frontend calls the internal API proxy (e.g. `/api/cards/search?q=bulb`) and not TCGdex directly

### Requirement: Modal is accessible
The card-search modal SHALL trap focus while open, use `role="dialog"` with an `aria-label`, and restore focus to the triggering element on close.

#### Scenario: Focus is trapped inside modal
- **WHEN** the modal is open and the user presses Tab
- **THEN** focus cycles only within the modal elements

#### Scenario: Focus restored on close
- **WHEN** the modal is closed
- **THEN** focus returns to the slot element that triggered the modal
