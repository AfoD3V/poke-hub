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
