## ADDED Requirements

### Requirement: Card renders as a free-floating 3D object in the modal
The card detail modal SHALL position the card using absolute positioning within the fixed overlay, with no parent flex container constraining its painted bounds. The card's `drop-shadow` and 3D perspective SHALL extend freely without being clipped by a sibling layout element. The card SHALL appear to float in space rather than sit inside a frame.

#### Scenario: Card has no flex-sibling constraints
- **WHEN** the card modal renders
- **THEN** the `flip-shadow-wrap` element has `position: absolute` and is not a flex child of any container other than the full-viewport overlay

#### Scenario: Card drop-shadow renders outside its bounding box
- **WHEN** the card is in the hovered/interacting state
- **THEN** the card's glow / drop-shadow is not clipped at any container edge

#### Scenario: Tilt does not look framed or windowed
- **WHEN** the user moves the pointer across the expanded card
- **THEN** the card rotates naturally in 3D space with no visible bounding rectangle artifact

### Requirement: Info panel is a floating aside
The card detail modal info panel SHALL be positioned as an absolute floating element (not a flex sibling). It SHALL have a semi-transparent dark background (`rgba(17,17,17,0.92)`) with `backdrop-filter: blur(20px)`, appearing to hover over the overlay independently of the card.

#### Scenario: Info panel renders alongside the card without framing the card
- **WHEN** the card modal opens
- **THEN** the info panel appears to the right of the card as an independent floating surface

#### Scenario: Info panel is visually separated from the card
- **WHEN** the modal renders
- **THEN** the card and info panel do not share a visible container border or background box

### Requirement: Modal close button is top-right corner, minimal
The close button SHALL be positioned at the top-right corner of the overlay (`position: absolute; top: 1rem; right: 1rem`). It SHALL render as a minimal icon-only or icon + "Close" text in muted colour, with no border box in the resting state.

#### Scenario: Close button position
- **WHEN** the card modal renders
- **THEN** the close button is in the top-right corner of the viewport overlay

#### Scenario: ESC key closes the modal
- **WHEN** the modal is open and the user presses Escape
- **THEN** the modal closes

#### Scenario: Backdrop click closes the modal
- **WHEN** the modal is open and the user clicks directly on the dark overlay (not on the card or info panel)
- **THEN** the modal closes

### Requirement: Flip animation plays on modal open
The card SHALL show the card-back face on open and flip to reveal the front face (holo side) within 700ms. This existing behaviour SHALL be preserved in the redesigned modal.

#### Scenario: Flip plays on open
- **WHEN** the user clicks a card to expand it
- **THEN** the card flips from back to front within 700ms

#### Scenario: Flip-back plays on close
- **WHEN** the user closes the modal
- **THEN** the card flips back to show the card back before dismissing

### Requirement: Rarity pill and action button use red accent
The rarity pill in the info panel SHALL use `ph-accent` / `ph-accent-dim` red colours. The "Add to Collection" button SHALL use a red accent style (`background: ph-accent-dim; border: ph-accent; color: ph-accent` at rest, solid red on hover).

#### Scenario: Rarity pill colour
- **WHEN** the info panel renders for a rare card
- **THEN** the rarity pill has a red-tinted background and red border (not purple)

#### Scenario: Add button colour
- **WHEN** the add button is in idle state
- **THEN** it uses red accent colour, not purple
