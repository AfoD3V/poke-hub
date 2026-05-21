## ADDED Requirements

### Requirement: All 7 Svelte components ported to React with CSS Modules
The following components SHALL exist as React functional components in `ui/src/lib/components/`, each with a co-located `ComponentName.module.css` file containing the verbatim CSS from the corresponding Svelte `<style>` block:

- `Card.tsx` / `Card.module.css`
- `HoverTilt.tsx` / `HoverTilt.module.css`
- `CardModal.tsx` / `CardModal.module.css`
- `Toast.tsx` / `Toast.module.css`
- `Sidebar.tsx` / `Sidebar.module.css`
- `LanguageSelector.tsx` / `LanguageSelector.module.css`
- `SeriesBrowser.tsx` / `SeriesBrowser.module.css`

#### Scenario: TypeScript check passes for all components
- **WHEN** `tsc --noEmit` is run in `ui/`
- **THEN** zero type errors across all component files

#### Scenario: No any types in component props
- **WHEN** ESLint is run in `ui/`
- **THEN** zero `@typescript-eslint/no-explicit-any` violations in component files

### Requirement: Card component preserves the full holographic effect
`Card.tsx` SHALL compute CSS custom properties (`--pointer-x`, `--pointer-y`, `--pointer-from-center`, `--pointer-from-top`, `--pointer-from-left`, `--card-opacity`, `--background-x`, `--background-y`, `--seedx`, `--seedy`) using the `useSpring` hook with the same stiffness/damping pairs as `Card.svelte`. These CSS variables SHALL be written to the card's root `style` attribute on each RAF frame.

`Card.tsx` SHALL use `data-rarity`, `data-subtypes`, `data-supertype`, and `className` (from type) to drive CSS Module selectors identically to the Svelte `data-*` attribute system.

#### Scenario: Holo effect activates on pointer enter
- **WHEN** the pointer moves over a rare-holo Card component
- **THEN** the `.card__shine` overlay becomes visible with the rainbow scanline pattern

#### Scenario: Holo effect fades on pointer leave
- **WHEN** the pointer leaves a Card component
- **THEN** `--card-opacity` animates back to 0 via the slow spring config

#### Scenario: Per-type glow applies via className
- **WHEN** a water-type card is rendered
- **THEN** the card root element has `className` containing `"water"` and the glow is `hsl(192, 97%, 60%)`

#### Scenario: Card image fallback renders on load error
- **WHEN** the card image URL returns a 404
- **THEN** the fallback div with the card name is displayed instead of a broken image

### Requirement: HoverTilt component is a React wrapper accepting children
`HoverTilt.tsx` SHALL accept `children: React.ReactNode` and props `tiltFactor`, `scaleFactor`, `shadow` (matching the Svelte slot/prop API). It SHALL use `useSpring` internally and apply a 3D CSS transform to a wrapper `<div>`.

#### Scenario: Tilt applies to children
- **WHEN** pointer moves over a HoverTilt-wrapped element
- **THEN** the wrapper div rotates on X and Y axes proportional to cursor position

#### Scenario: Tilt resets on pointer leave
- **WHEN** pointer leaves HoverTilt
- **THEN** the wrapper springs back to `rotateX(0) rotateY(0)` using the relaxed spring config

### Requirement: CardModal renders full card details in an overlay
`CardModal.tsx` SHALL accept a `TcgCard` prop and render the card image at full size, card name, set, number, rarity, types, HP, attacks, and weaknesses. It SHALL be dismissible by clicking the backdrop or pressing Escape.

#### Scenario: Modal renders card details
- **WHEN** `<CardModal card={card} onClose={() => {}} />` is rendered
- **THEN** the card name, rarity, and set are visible in the DOM

#### Scenario: Escape key closes modal
- **WHEN** the modal is open and the Escape key is pressed
- **THEN** `onClose` callback is invoked

#### Scenario: Backdrop click closes modal
- **WHEN** the backdrop area outside the card image is clicked
- **THEN** `onClose` callback is invoked

### Requirement: CSS Module selectors preserve all data-rarity and pseudo-element rules
Every `data-*` attribute selector and pseudo-element (`::before`, `::after`) in the original Svelte `<style>` blocks SHALL appear verbatim in the corresponding `.module.css` files. CSS Modules SHALL NOT hash `data-*` attribute names or pseudo-selectors — only local class names are hashed.

#### Scenario: Rare holo selector applies in module
- **WHEN** a Card with `data-rarity="rare holo"` is rendered
- **THEN** the CSS rule `[data-rarity="rare holo"] .card__shine` applies the rainbow background — confirming the attribute selector is not broken by module hashing

### Requirement: Vitest tests exist for each component
Each component SHALL have at minimum a smoke-test in `ComponentName.test.tsx` confirming it renders without throwing. `Card.tsx` and `HoverTilt.tsx` SHALL have additional interaction tests covering pointer move and leave events.

#### Scenario: All component tests pass
- **WHEN** `bun run test` is run in `ui/`
- **THEN** all component tests pass with zero failures
