## ADDED Requirements

### Requirement: Home dashboard is the post-login landing page
The system SHALL provide a `/home` route that renders a dashboard for authenticated users. Unauthenticated users visiting `/home` SHALL be redirected to `/auth/login`.

#### Scenario: Authenticated user sees dashboard
- **WHEN** an authenticated user visits `/home`
- **THEN** the page SHALL render without redirect and display a welcome heading

#### Scenario: Unauthenticated user redirected
- **WHEN** a user without a valid session visits `/home`
- **THEN** they SHALL be redirected to `/auth/login`

### Requirement: Home dashboard displays collection summary stats
The home page SHALL display summary statistics derived from the user's collection: total number of cards and number of unique Pokémon.

#### Scenario: Stats shown when collection is non-empty
- **WHEN** the user's collection contains cards
- **THEN** the dashboard SHALL display the total card count and unique Pokémon count as stat cards

#### Scenario: Zero-state when collection is empty
- **WHEN** the user's collection is empty
- **THEN** the dashboard SHALL display 0 for both stats and show a prompt to browse cards via the Search page

### Requirement: Home dashboard provides quick-action entry points
The dashboard SHALL include prominent links or buttons that navigate users to Search and Collection pages.

#### Scenario: Quick-action link to Search
- **WHEN** the user is on `/home`
- **THEN** a visible link or button navigating to `/search` SHALL be present

#### Scenario: Quick-action link to Collection
- **WHEN** the user is on `/home`
- **THEN** a visible link or button navigating to `/collection` SHALL be present
