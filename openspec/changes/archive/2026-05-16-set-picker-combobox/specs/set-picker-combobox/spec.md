## ADDED Requirements

### Requirement: Combobox replaces Set ID text input
The "By Set & Number" form's Set ID field SHALL be a combobox that fetches the set list from `/api/sets` on first render and filters results client-side as the user types. The underlying TCGdex set ID SHALL never be displayed to the user.

#### Scenario: Dropdown appears on focus
- **WHEN** the user focuses the Set ID combobox
- **THEN** a dropdown appears showing up to 10 sets sorted by release date (newest first)

#### Scenario: Filtering by name
- **WHEN** the user types "Darkness" in the combobox
- **THEN** only sets whose name contains "Darkness" (case-insensitive) are shown

#### Scenario: Filtering by abbreviation
- **WHEN** the user types "MEW" in the combobox
- **THEN** the "151" set appears in the dropdown (matched by its official abbreviation)

#### Scenario: Filtering by TCGdex ID
- **WHEN** the user types "sv03" in the combobox
- **THEN** sets whose TCGdex ID starts with "sv03" appear in the dropdown

#### Scenario: No results state
- **WHEN** the user types a string that matches no set
- **THEN** the dropdown shows "No sets found" and the Look up button remains disabled

#### Scenario: Selecting a set
- **WHEN** the user clicks or presses Enter on a dropdown item
- **THEN** the input displays `"Name (ABBR)"` (or `"Name"` if no abbreviation) and the internal set ID is stored for use in the card lookup

#### Scenario: Keyboard navigation
- **WHEN** the dropdown is open and the user presses ArrowDown / ArrowUp
- **THEN** the highlighted option moves through the list; pressing Enter selects the highlighted option; pressing Escape closes the dropdown without selection

#### Scenario: Fallback when sets fail to load
- **WHEN** the `/api/sets` request fails or returns an empty list
- **THEN** the combobox degrades to a plain text input with placeholder `"Set ID (e.g. sv03.5)"`; the card lookup still functions if the user types a valid TCGdex ID manually

### Requirement: Accessibility
The combobox SHALL meet WCAG 2.1 AA for interactive controls.

#### Scenario: ARIA roles present
- **WHEN** the combobox is rendered
- **THEN** the input has `role="combobox"`, `aria-expanded`, and `aria-autocomplete="list"`; the dropdown list has `role="listbox"`; each option has `role="option"` and `aria-selected`

#### Scenario: Screen reader announces active option
- **WHEN** the user navigates the dropdown with arrow keys
- **THEN** `aria-activedescendant` on the input points to the currently highlighted option's id
