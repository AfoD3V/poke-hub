## ADDED Requirements

### Requirement: useSpring hook implements the Svelte spring ODE
A `useSpring<T>(initialValue: T, config?: SpringConfig)` hook SHALL exist at `ui-react/src/lib/hooks/useSpring.ts`. It SHALL implement the same damped-spring update loop as Svelte's `spring()`:

```
velocity += (target - value) * stiffness
velocity *= (1 - damping)
value += velocity
```

This loop SHALL run each `requestAnimationFrame` until the spring settles (velocity and delta both < 0.001). The hook SHALL return `[currentValue: T, set: SetSpring<T>]` where `set(target, opts?)` accepts an optional `{ soft: number }` option that pre-damps the velocity before targeting (matching Svelte's soft-set behaviour).

#### Scenario: Spring settles to target
- **WHEN** `set({ x: 100, y: 100 })` is called on a spring at `{ x: 0, y: 0 }`
- **THEN** within 2 seconds the current value is within 0.001 of `{ x: 100, y: 100 }`

#### Scenario: Stiffness controls convergence speed
- **WHEN** two springs are created with `stiffness: 0.5` and `stiffness: 0.01` respectively and both are set to the same target
- **THEN** the high-stiffness spring reaches within 1% of target before the low-stiffness spring

#### Scenario: Damping controls overshoot
- **WHEN** a spring with `damping: 0.06` is set to a new target
- **THEN** the value overshoots the target before settling (underdamped behaviour observed)

#### Scenario: Soft-set pre-damps velocity
- **WHEN** `set(target, { soft: 1 })` is called while the spring is in motion
- **THEN** the spring does not abruptly change direction but smoothly transitions toward the new target

### Requirement: useSpring matches the exact config pairs used in Card.svelte
The hook SHALL produce visually equivalent motion to the Svelte spring when initialised with:
- Interact (fast): `{ stiffness: 0.066, damping: 0.25 }`
- Relax (slow): `{ stiffness: 0.01, damping: 0.06 }`

These are the pairs used in `Card.svelte`'s `springGlare` and `springBg` stores.

#### Scenario: Visual regression baseline passes
- **WHEN** a Playwright screenshot is taken of the React Card component hovered at the same cursor position as the Svelte Card reference screenshot
- **THEN** the pixel difference between the two screenshots is less than 2%

### Requirement: useSpring supports object values with numeric leaf nodes
The hook SHALL accept any object type `T` where every leaf value is a number (e.g. `{ x: number, y: number, o: number }`). Each numeric property SHALL be interpolated independently on the same RAF loop.

#### Scenario: Multi-property object interpolated
- **WHEN** a spring is initialised with `{ x: 50, y: 50, o: 0 }` and set to `{ x: 80, y: 20, o: 1 }`
- **THEN** all three properties animate concurrently toward their targets

### Requirement: useSpring unit tested with Vitest
`ui-react/src/lib/hooks/useSpring.test.ts` SHALL contain unit tests covering: settle-to-target, stiffness comparison, damping overshoot, and soft-set behaviour. Tests SHALL use `@testing-library/react-hooks` or `renderHook` from `@testing-library/react`.

#### Scenario: All useSpring unit tests pass
- **WHEN** `bun run test` is run in `ui-react/`
- **THEN** all useSpring tests pass with zero failures
