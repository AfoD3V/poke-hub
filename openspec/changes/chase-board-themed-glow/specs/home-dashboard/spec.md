## MODIFIED Requirements

### Requirement: Chase Board section on home dashboard
The system SHALL render the "Chase Board" content inside the **Chase Board tab** of the home dashboard tab navigation (see `home-dashboard-tabs` spec). The Chase Board SHALL NOT appear inline below the collection stats. The tab itself SHALL always be visible; an empty-state message SHALL be shown when the user has no chased cards.

#### Scenario: Chase Board content appears inside Chase Board tab
- **WHEN** the user clicks the "Chase Board" tab on `/home`
- **THEN** the set-grouped chase panels are displayed inside the tab content area

#### Scenario: Chase Board empty state shown in tab
- **WHEN** the user has no chased cards and opens the "Chase Board" tab
- **THEN** an empty-state message is displayed instead of set panels

#### Scenario: Chase Board not visible on Overview tab
- **WHEN** the user is on the "Overview" tab
- **THEN** no chase-board panels are rendered in the DOM
