## ADDED Requirements

### Requirement: Binder grid view renders pages
The UI SHALL render the active page of a binder as a grid with cols × rows slots. Each occupied slot SHALL display the card thumbnail, rarity badge, and set code badge. Each empty slot SHALL display a "+" icon. Page navigation controls SHALL show the current page number and total pages, with prev/next buttons.

#### Scenario: Grid renders correct slot count
- **WHEN** a 4×4 binder page is displayed
- **THEN** exactly 16 slot cells are rendered

#### Scenario: Occupied slot shows card thumbnail
- **WHEN** a slot has a placed card
- **THEN** the slot displays the card's `imageSmall` thumbnail, rarity badge, and set-code badge

#### Scenario: Empty slot shows add icon
- **WHEN** a slot has no placed card
- **THEN** the slot displays a circular "+" icon

#### Scenario: Page navigation shows correct page number
- **WHEN** the user is on page 2 of a 3-page binder
- **THEN** the pagination indicator reads "2 / 3"

#### Scenario: Prev button is disabled on first page
- **WHEN** the user is on page 1
- **THEN** the Previous button is disabled

#### Scenario: Next button is disabled on last page
- **WHEN** the user is on the last page
- **THEN** the Next button is disabled

### Requirement: User can place a card in an empty slot
An authenticated user SHALL be able to place a card in an empty slot by clicking it. The system SHALL open the card-search modal. Upon card selection, the system SHALL record the placement and update the UI optimistically.

#### Scenario: Clicking empty slot opens card search
- **WHEN** the user clicks an empty slot
- **THEN** the card-search modal opens with the slot context set

#### Scenario: Card placement persists
- **WHEN** the user selects a card in the search modal
- **THEN** the slot displays the selected card's thumbnail immediately and the placement is saved to the backend

#### Scenario: Placing a card in an already-occupied slot replaces it
- **WHEN** the user clicks an occupied slot and selects a new card
- **THEN** the slot is updated with the new card and the old card is removed from that slot

### Requirement: User can clear a slot
An authenticated user SHALL be able to remove a card from a slot via a slot action. The slot SHALL revert to the empty "+" state.

#### Scenario: Clear slot via action toolbar
- **WHEN** the user selects a slot and chooses "Clear slot" from the action toolbar
- **THEN** the slot becomes empty and the backend record is deleted

#### Scenario: Clear is idempotent on empty slot
- **WHEN** the user attempts to clear an already-empty slot
- **THEN** no error is shown and the slot remains empty

### Requirement: User can move a card to another slot
An authenticated user SHALL be able to move a card from one slot to another on the same page or across pages. The source slot SHALL become empty after the move.

#### Scenario: Move card to empty slot
- **WHEN** the user selects a slot with a card and chooses "Move", then selects an empty destination slot
- **THEN** the card appears in the destination slot and the source slot becomes empty

#### Scenario: Move to occupied slot swaps cards
- **WHEN** the user moves a card to an occupied destination slot
- **THEN** the two cards swap positions

### Requirement: User can copy a card to another slot
An authenticated user SHALL be able to copy a card from one slot to another. The source slot SHALL retain its card after the copy. The same card (by card ID) may appear in multiple slots.

#### Scenario: Copy card to empty slot
- **WHEN** the user selects a slot with a card and chooses "Copy", then selects an empty destination slot
- **THEN** the card appears in both the source and destination slots

### Requirement: Slot action toolbar
The UI SHALL display a contextual action toolbar when a slot is selected (via click or long-press equivalent). Actions SHALL include: Edit (open search modal to replace), Clear slot, Move, Copy. The toolbar SHALL dismiss when the user clicks outside or presses Escape.

#### Scenario: Toolbar appears on slot selection
- **WHEN** the user clicks an occupied slot
- **THEN** the action toolbar becomes visible with Edit, Clear, Move, Copy actions

#### Scenario: Toolbar dismisses on outside click
- **WHEN** the user clicks outside the active slot while the toolbar is visible
- **THEN** the toolbar dismisses without any action taken

### Requirement: Ownership enforced on all slot mutations
The backend SHALL verify that the authenticated user owns the binder before any slot write (place, clear, move, copy). Unauthorised mutations SHALL return 404.

#### Scenario: Slot write by non-owner is rejected
- **WHEN** a user attempts to write to a slot in a binder they do not own
- **THEN** the system returns 404 and no data is changed
