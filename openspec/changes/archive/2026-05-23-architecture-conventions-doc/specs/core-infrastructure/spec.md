## MODIFIED Requirements

### Requirement: CLAUDE.md references ARCHITECTURE.md
`CLAUDE.md` SHALL contain an "Architecture Reference" section that names `ARCHITECTURE.md` as the authoritative source for structural and naming decisions, states the prime directive ("does this structure serve the code, or does the code serve the structure?"), and instructs agents to consult the decision checklist in `ARCHITECTURE.md` before adding any new file.

#### Scenario: Agent starting a structural task
- **WHEN** an agent is about to create a new component, hook, or service file
- **THEN** `CLAUDE.md` instructs it to consult `ARCHITECTURE.md`'s decision checklist first

#### Scenario: Agent asked about file placement
- **WHEN** an agent is asked "where should this go?"
- **THEN** `CLAUDE.md` directs it to `ARCHITECTURE.md` as the authoritative answer

### Requirement: AGENTS.md references ARCHITECTURE.md
`AGENTS.md` SHALL contain a matching "Architecture Reference" section consistent with `CLAUDE.md`, per the keep-in-sync rule. Both files MUST be updated in the same commit.

#### Scenario: AGENTS.md and CLAUDE.md in sync
- **WHEN** the architecture reference section exists in `CLAUDE.md`
- **THEN** an equivalent section exists in `AGENTS.md` in the same commit

### Requirement: Playwright screenshots land in dedicated folder
All Playwright screenshots taken during debugging, testing, or development SHALL be saved to a dedicated `screenshots/` directory at the repo root. No screenshot files SHALL be written to arbitrary locations (repo root, `ui/`, `server/`, etc.). The `screenshots/` directory SHALL be listed in `.gitignore`.

#### Scenario: Agent takes a debug screenshot
- **WHEN** an agent calls `playwright-cli screenshot` or `playwright-cli snapshot`
- **THEN** the output file is written inside `screenshots/` (e.g., `screenshots/debug-home.png`), not at the repo root or inside a package directory

#### Scenario: screenshots/ directory absent
- **WHEN** the `screenshots/` directory does not yet exist
- **THEN** the agent creates it before writing the first screenshot

### Requirement: ARCHITECTURE.md keep-in-sync rule
`CLAUDE.md` SHALL state that `ARCHITECTURE.md` MUST be updated whenever a new structural pattern is introduced or a documented convention changes — in the same commit as the code change. This extends the existing `CLAUDE.md`↔`AGENTS.md` keep-in-sync rule to include `ARCHITECTURE.md`.

#### Scenario: New convention introduced
- **WHEN** an agent introduces a new structural pattern (e.g., a new sub-layer in `ui/src/`)
- **THEN** `CLAUDE.md` requires `ARCHITECTURE.md` to be updated in the same commit
