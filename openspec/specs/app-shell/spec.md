## ADDED Requirements

### Requirement: Sidebar navigation is present on all authenticated pages
The app SHALL render a persistent sidebar containing the PokeHub brand mark and navigation links for all routes under the authenticated app shell (Home, Search, Collection).

#### Scenario: Sidebar visible on home page
- **WHEN** an authenticated user visits `/home`
- **THEN** the sidebar SHALL be visible with links to Home, Search, and Collection

#### Scenario: Sidebar visible on search page
- **WHEN** an authenticated user visits `/search`
- **THEN** the sidebar SHALL be visible with links to Home, Search, and Collection

#### Scenario: Sidebar visible on collection page
- **WHEN** an authenticated user visits `/collection`
- **THEN** the sidebar SHALL be visible with links to Home, Search, and Collection

#### Scenario: Sidebar is not shown on auth pages
- **WHEN** a user visits `/auth/login` or `/auth/register`
- **THEN** the sidebar SHALL NOT be rendered

### Requirement: Active navigation link is visually distinguished
The sidebar SHALL highlight the link corresponding to the current route so users know where they are.

#### Scenario: Active link highlighted
- **WHEN** the user is on `/collection`
- **THEN** the Collection link in the sidebar SHALL have the active visual style applied
- **AND** the Home and Search links SHALL NOT have the active style

### Requirement: Sidebar navigation links are keyboard accessible
All sidebar nav links SHALL be reachable and activatable via keyboard (Tab + Enter).

#### Scenario: Keyboard navigation through sidebar
- **WHEN** the user tabs through the sidebar
- **THEN** each link SHALL receive visible focus in document order
- **AND** pressing Enter on a focused link SHALL navigate to that route

### Requirement: Authenticated layout uses route group isolation
The Sidebar layout SHALL only wrap routes inside the `(app)` Next.js route group (`app/(app)/layout.tsx`); auth routes (`app/auth/`) MUST remain outside this group and render without the Sidebar.

#### Scenario: Route group separation
- **WHEN** Next.js resolves the layout hierarchy for `/auth/login`
- **THEN** `app/(app)/layout.tsx` SHALL NOT be in the ancestor chain

#### Scenario: Route group separation for app routes
- **WHEN** Next.js resolves the layout hierarchy for `/home`
- **THEN** `app/(app)/layout.tsx` SHALL be in the ancestor chain and the Sidebar SHALL be rendered

### Requirement: Root redirects to home for authenticated users
The root route (`/`) SHALL redirect authenticated users to `/home` and unauthenticated users to `/auth/login`.

#### Scenario: Authenticated user at root
- **WHEN** a user with a valid session cookie visits `/`
- **THEN** they SHALL be redirected to `/home`

#### Scenario: Unauthenticated user at root
- **WHEN** a user with no session cookie visits `/`
- **THEN** they SHALL be redirected to `/auth/login`
