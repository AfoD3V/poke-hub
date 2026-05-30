## ADDED Requirements

### Requirement: User can create a binder
An authenticated user SHALL be able to create a named binder with a chosen icon and grid size. The system SHALL persist the binder and associate it with the user. Default grid size is 4×4. A new binder starts with one empty page.

#### Scenario: Successful binder creation
- **WHEN** the user submits a create-binder request with a valid name, icon, and grid size
- **THEN** the system creates the binder, creates one initial page, and returns the new binder with its ID

#### Scenario: Missing name is rejected
- **WHEN** the user submits a create-binder request with an empty or whitespace-only name
- **THEN** the system returns 400 with a validation error

#### Scenario: Invalid grid size is rejected
- **WHEN** the user submits a create-binder request with a grid size not in the allowed set (3×3, 4×4)
- **THEN** the system returns 400 with a validation error

#### Scenario: Unauthenticated request is rejected
- **WHEN** an unauthenticated request is made to create a binder
- **THEN** the system returns 401

### Requirement: User can list their binders
An authenticated user SHALL be able to retrieve a list of all their binders. Each list item SHALL include: name, icon, grid size, page count, filled-slot count, total-slot count, and estimated market value (sum of cached card prices, 0 for uncached cards).

#### Scenario: List returns all binders
- **WHEN** the user requests their binder list and has two binders
- **THEN** the system returns both binders with correct stats

#### Scenario: Empty list for new user
- **WHEN** the user requests their binder list and has no binders
- **THEN** the system returns an empty array

#### Scenario: Stats reflect actual slot contents
- **WHEN** a binder has 2 pages (4×4 each = 32 total slots) and 3 cards placed
- **THEN** the list item shows filledSlots=3, totalSlots=32

### Requirement: User can view a single binder
An authenticated user SHALL be able to retrieve a single binder by ID, including all pages and their slot contents. The system SHALL return 404 if the binder does not exist or belongs to another user.

#### Scenario: Binder returned with pages and slots
- **WHEN** the user requests a binder they own
- **THEN** the system returns the binder, its pages in page_number order, and all slots with card snapshots for occupied slots

#### Scenario: Other user's binder is not accessible
- **WHEN** the user requests a binder owned by a different user
- **THEN** the system returns 404

### Requirement: User can update a binder
An authenticated user SHALL be able to rename a binder, change its icon, or change its grid size. Changing grid size SHALL be rejected if any existing page has a slot with an index that falls outside the new grid bounds.

#### Scenario: Rename succeeds
- **WHEN** the user sends a PATCH with a new valid name
- **THEN** the binder name is updated and the updated binder is returned

#### Scenario: Grid size change blocked when slots would be orphaned
- **WHEN** the user attempts to change a 4×4 binder to 3×3 and slot index 15 is occupied
- **THEN** the system returns 409 with an error indicating slots outside new bounds exist

#### Scenario: Grid size change succeeds when no out-of-bounds slots exist
- **WHEN** the user attempts to change a 4×4 binder to 3×3 and all occupied slots have indices within 0–8
- **THEN** the binder grid size is updated

### Requirement: User can delete a binder
An authenticated user SHALL be able to delete a binder. The system SHALL cascade-delete all pages and slots belonging to that binder.

#### Scenario: Deletion removes binder and all children
- **WHEN** the user deletes a binder with pages and slots
- **THEN** the binder, its pages, and its slots are all removed; subsequent GET returns 404

#### Scenario: Cannot delete another user's binder
- **WHEN** the user attempts to delete a binder they do not own
- **THEN** the system returns 404 and no data is deleted

### Requirement: User can manage binder pages
An authenticated user SHALL be able to add pages to a binder and remove empty pages. The system SHALL prevent removal of a page that has any occupied slot.

#### Scenario: Add page increments page count
- **WHEN** the user adds a page to a binder with 1 existing page
- **THEN** the new page is created with page_number=2 and the binder page count becomes 2

#### Scenario: Remove empty page succeeds
- **WHEN** the user removes a page that has no occupied slots
- **THEN** the page is deleted

#### Scenario: Remove occupied page is rejected
- **WHEN** the user attempts to remove a page that has at least one occupied slot
- **THEN** the system returns 409 with a clear error

### Requirement: Binders list page is accessible from the sidebar
The UI SHALL render a "Binders" navigation item in the sidebar (desktop) and bottom navigation (mobile). Clicking it SHALL navigate to `/binders`.

#### Scenario: Binders link present in sidebar
- **WHEN** an authenticated user views any page
- **THEN** the sidebar contains a "Binders" link

#### Scenario: Binders index page renders binder cards
- **WHEN** the user navigates to `/binders`
- **THEN** the page displays one card per binder showing name, icon, page count, and filled/total slot counts

### Requirement: Create and edit binder modal/panel
The UI SHALL provide a modal or bottom-sheet for creating a new binder and editing an existing one. Fields: name (text input), icon (dropdown), grid size (dropdown with options 3×3 and 4×4). The edit form SHALL pre-populate with current values and include a "Delete binder" action.

#### Scenario: Create form appears on "New Binder" button click
- **WHEN** the user clicks the "New Binder" button on the binders list page
- **THEN** a modal/panel appears with empty name, default icon, and default grid size (4×4)

#### Scenario: Edit form pre-populates
- **WHEN** the user opens the edit panel for an existing binder
- **THEN** the name, icon, and grid size fields reflect the binder's current values

#### Scenario: Save persists changes
- **WHEN** the user edits the name and clicks Save
- **THEN** the binder list reflects the new name without a full page reload
