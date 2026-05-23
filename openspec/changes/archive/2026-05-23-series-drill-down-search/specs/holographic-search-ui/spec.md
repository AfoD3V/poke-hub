## MODIFIED Requirements

### Requirement: Search UI results grid
The frontend SHALL provide a search interface with two tabs: "By Name" and "By Series". The By Name tab SHALL query the proxy by card name (with language selection) and render results as a grid of holographic `Card` components. The By Series tab SHALL provide the three-column drill-down browser (series → sets → cards).

#### Scenario: By Name tab — successful search
- **WHEN** a user submits a Pokémon name on the By Name tab
- **THEN** the UI renders matching cards in a holographic grid layout

#### Scenario: By Series tab — initial view
- **WHEN** the user switches to the By Series tab
- **THEN** the series grid (Column 1) is shown full-width with all available series

### Requirement: Holographic card effects
Search results and set card grids SHALL render using the existing `Card` component with cursor-tracking holographic effects.

#### Scenario: Hovering over a card in By Name results
- **WHEN** a user moves the cursor over a rendered card in By Name results
- **THEN** the holographic effect responds to cursor position

#### Scenario: Hovering over a card in Column 3 (set card grid)
- **WHEN** a user moves the cursor over a rendered card in the series browser Column 3
- **THEN** the holographic effect responds to cursor position

### Requirement: Loading and error states
The search UI MUST display loading and error states during proxy requests on both tabs.

#### Scenario: By Name — request in flight
- **WHEN** a name search request is pending
- **THEN** the UI shows a loading state (skeleton grid or spinner)

#### Scenario: By Name — request failure
- **WHEN** a name search request fails
- **THEN** the UI shows an error message in the By Name tab area

#### Scenario: By Series — series fetch failure
- **WHEN** the series list request fails
- **THEN** the By Series tab shows an error state with a retry action; the By Name tab is unaffected

## REMOVED Requirements

### Requirement: Set and card number lookup form
**Reason:** Replaced by the three-column series browser (By Series tab). Users can now navigate to any card by drilling down from series → set → card grid. The raw set ID input is no longer needed.
**Migration:** Existing `?mode=set&setId=...&cardNumber=...` deep links are handled by the legacy compatibility requirement in `series-browser` spec; no user action required.
