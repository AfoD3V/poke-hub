## ADDED Requirements

### Requirement: Set and card number lookup endpoint
The backend SHALL expose `GET /api/cards/by-set` accepting `setId` (e.g., `SVN`) and `cardNumber` (e.g., `112`) query parameters and return a single `TcgCard` JSON object.

#### Scenario: Valid set and card number
- **WHEN** a request is made with a valid `setId` and `cardNumber`
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

### Requirement: Search mode selector in the Search tab
The Search UI SHALL present a mode selector allowing users to choose between "By Name" and "By Set & Number" search modes.

#### Scenario: Default mode is "By Name"
- **WHEN** a user opens the Search tab with no URL params
- **THEN** the "By Name" mode is active and the single text input is displayed

#### Scenario: Switching to "By Set & Number" mode
- **WHEN** a user selects "By Set & Number"
- **THEN** the text input is replaced by two fields: Set ID (e.g., `SVN`) and Card Number (e.g., `112`)

#### Scenario: Submitting a set/number search
- **WHEN** a user enters a valid set ID and card number and submits
- **THEN** the card grid displays the single matching card

#### Scenario: URL persistence of mode and params
- **WHEN** a set/number search is executed
- **THEN** the URL updates to include `?mode=set&setId=<id>&cardNumber=<num>` so the result is shareable and survives a page reload

#### Scenario: Direct URL load in set mode
- **WHEN** a user navigates directly to `?mode=set&setId=SVN&cardNumber=112`
- **THEN** the server load function performs the set/number lookup and pre-renders the card result

### Requirement: SvelteKit proxy for set lookup
The SvelteKit layer SHALL provide `GET /api/cards/by-set` that forwards `setId` and `cardNumber` params to the Hono backend.

#### Scenario: Successful proxy
- **WHEN** the UI calls `/api/cards/by-set?setId=SVN&cardNumber=112`
- **THEN** the SvelteKit route forwards the request and returns the Hono response unchanged

#### Scenario: Error passthrough
- **WHEN** the Hono backend returns a 4xx or 5xx response
- **THEN** the SvelteKit proxy returns the same status code and error body to the client
