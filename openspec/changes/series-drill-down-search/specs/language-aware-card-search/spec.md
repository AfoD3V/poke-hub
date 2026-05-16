## ADDED Requirements

### Requirement: Language selector on name search
The By Name search tab SHALL display a language selector allowing the user to choose the TCGdex language for their search. Supported languages SHALL be: English (`en`), Japanese (`ja`), French (`fr`), German (`de`), Spanish (`es`), Italian (`it`), and Portuguese (`pt`). The default SHALL be English.

#### Scenario: Language selector visible
- **WHEN** the user is on the By Name tab
- **THEN** a language selector control is visible showing the currently selected language

#### Scenario: Default language is English
- **WHEN** the search page first loads
- **THEN** the language selector shows English as the selected language

#### Scenario: Changing language
- **WHEN** the user selects Japanese from the language selector and submits a search
- **THEN** the search query is sent to the Japanese TCGdex endpoint and results reflect Japanese card names

### Requirement: Language-routed search backend
The backend SHALL accept an optional `lang` query parameter on `GET /api/cards/search`. When provided, the search SHALL use the corresponding TCGdex language endpoint (`/v2/{lang}/graphql`). When absent, the search SHALL default to English.

#### Scenario: English search (default)
- **WHEN** `GET /api/cards/search?q=Pikachu` is called without a `lang` param
- **THEN** results are fetched from the English TCGdex endpoint

#### Scenario: Japanese search
- **WHEN** `GET /api/cards/search?q=ピカチュウ&lang=ja` is called
- **THEN** results are fetched from the Japanese TCGdex endpoint (`/v2/ja/graphql`)

#### Scenario: Invalid language code
- **WHEN** `GET /api/cards/search?q=Pikachu&lang=zz` is called with an unsupported language code
- **THEN** the endpoint returns HTTP 400 with `{ "error": "Unsupported language: zz" }`
