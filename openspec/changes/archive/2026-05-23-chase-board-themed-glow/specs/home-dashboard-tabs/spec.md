## ADDED Requirements

### Requirement: Home dashboard tab navigation
The system SHALL render a tab bar at the top of the `/home` page with exactly two tabs: **Overview** and **Chase Board**. The active tab SHALL be visually distinguished (underline + accent color). Tab selection SHALL be managed as local UI state (no URL change).

#### Scenario: Overview tab is active by default
- **WHEN** a user navigates to `/home`
- **THEN** the "Overview" tab is active and its content (collection stats + quick actions) is visible

#### Scenario: Switching to Chase Board tab shows chase content
- **WHEN** the user clicks the "Chase Board" tab
- **THEN** the Chase Board panel list becomes visible and the stats/quick-actions section is hidden

#### Scenario: Switching back to Overview hides chase content
- **WHEN** the user is on the "Chase Board" tab and clicks "Overview"
- **THEN** the collection stats and quick actions are shown again and the Chase Board is hidden

#### Scenario: Chase Board tab shows entry count badge
- **WHEN** the user has at least one chased card
- **THEN** the "Chase Board" tab label SHALL include a numeric badge showing the total count of chased cards

#### Scenario: Chase Board tab accessible without cards
- **WHEN** the user has no chased cards and clicks the "Chase Board" tab
- **THEN** the tab switches and an empty-state message is displayed (e.g., "No cards on your Chase Board yet")
