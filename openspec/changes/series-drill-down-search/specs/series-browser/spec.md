## ADDED Requirements

### Requirement: Series grid (Column 1)
The By Series tab SHALL display a full-width grid of all series as logo tiles on initial load. Each tile SHALL show the series logo image (or a named placeholder if no logo) and the series name below it. Series SHALL be ordered by release date descending; series without a release date appear last, sorted alphabetically.

#### Scenario: Series grid renders on tab switch
- **WHEN** the user switches to the By Series tab
- **THEN** a grid of series tiles is visible, each showing a logo or placeholder and the series name

#### Scenario: Loading state
- **WHEN** the series data is not yet available
- **THEN** skeleton placeholder tiles are shown in place of the series grid

#### Scenario: Series fetch failure
- **WHEN** the series list fails to load
- **THEN** an error message is shown with a retry button; the By Name tab remains functional

### Requirement: Set grid (Column 2)
After the user selects a series, Column 1 SHALL animate to a narrow strip (~30% width) and Column 2 SHALL slide in at ~70% width showing the sets within that series. Each set tile SHALL show the set logo (or placeholder) and name. Sets SHALL be ordered by release date descending within the series.

#### Scenario: Selecting a series reveals sets
- **WHEN** the user clicks a series tile
- **THEN** Column 1 slides left to a narrow strip and Column 2 appears with the sets of that series

#### Scenario: Set tiles show logo and name
- **WHEN** Column 2 is visible
- **THEN** each tile displays the set logo image (or placeholder) and the set name below it

#### Scenario: Loading state for sets
- **WHEN** sets are being fetched after a series selection
- **THEN** skeleton tiles are shown in Column 2

### Requirement: Card grid (Column 3)
After the user selects a set, Columns 1 and 2 SHALL animate further left and Column 3 SHALL slide in showing all cards in that set rendered as holographic `Card` components. Cards SHALL be paginated at 40 per page with a "Load more" button. Clicking a card SHALL open the existing `CardModal`.

#### Scenario: Selecting a set reveals cards
- **WHEN** the user clicks a set tile in Column 2
- **THEN** Columns 1 and 2 slide left and Column 3 appears with the first 40 cards of that set

#### Scenario: Cards render with holographic effect
- **WHEN** Column 3 is visible
- **THEN** each card is rendered using the existing `Card` component with its holographic tilt effect

#### Scenario: Pagination
- **WHEN** a set has more than 40 cards and the user clicks "Load more"
- **THEN** the next 40 cards are appended to the grid

#### Scenario: Card modal on click
- **WHEN** the user clicks a card in Column 3
- **THEN** the `CardModal` opens with that card's details

### Requirement: Breadcrumb navigation
The browser SHALL display a breadcrumb showing the current drill-down path (e.g. "Series › Scarlet & Violet › 151"). Each breadcrumb segment SHALL be a link that navigates back to that column level, resetting deeper columns.

#### Scenario: Breadcrumb visible at Column 2
- **WHEN** the user has selected a series (Column 2 visible)
- **THEN** a breadcrumb shows "Series › {series name}" and clicking "Series" resets to Column 1 full-width

#### Scenario: Breadcrumb visible at Column 3
- **WHEN** the user has selected a series and a set (Column 3 visible)
- **THEN** a breadcrumb shows "Series › {series name} › {set name}" and clicking any segment navigates back to that level

### Requirement: Legacy deep-link compatibility
If the page URL contains `mode=set` with `setId` and `cardNumber` query parameters, the page SHALL silently execute a card lookup and display the result before rendering the series browser, so existing bookmarks and shared links continue to work.

#### Scenario: Legacy URL triggers card lookup
- **WHEN** the user visits `/search?mode=set&setId=sv03.5&cardNumber=92`
- **THEN** the card lookup is executed and the result card is displayed without requiring any user interaction
