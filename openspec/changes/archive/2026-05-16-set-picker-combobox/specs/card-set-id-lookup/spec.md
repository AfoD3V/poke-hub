## MODIFIED Requirements

### Requirement: Set and card number lookup endpoint
The backend SHALL expose `GET /api/cards/by-set` accepting `setId` (TCGdex internal ID, e.g. `sv03.5`) and `cardNumber` (e.g. `92`) query parameters and return a single `TcgCard` JSON object. The `setId` is now always a TCGdex ID — the combobox resolves abbreviations to IDs before submitting; the endpoint itself has no abbreviation awareness.

#### Scenario: Valid set and card number
- **WHEN** a request is made with a valid TCGdex `setId` and `cardNumber`
- **THEN** the endpoint returns HTTP 200 with a single `TcgCard` object

#### Scenario: Missing parameters
- **WHEN** `setId` or `cardNumber` is absent or blank
- **THEN** the endpoint returns HTTP 400 with `{ "error": "Missing required parameters: setId and cardNumber" }`

#### Scenario: Card not found
- **WHEN** the upstream TCGdex API returns 404 for the given set/number combination
- **THEN** the endpoint returns HTTP 404 with `{ "error": "Card not found" }`

#### Scenario: Upstream failure
- **WHEN** TCGdex returns a non-200, non-404 response or times out
- **THEN** the endpoint returns HTTP 502 or 504 with an appropriate error message
