## ADDED Requirements

### Requirement: User registration
The backend SHALL provide a registration endpoint that creates a new user record and establishes an authenticated session.

#### Scenario: Successful registration
- **WHEN** a user submits valid registration data
- **THEN** the system creates the user and returns an authenticated response with an HttpOnly session cookie

### Requirement: User login
The backend SHALL provide a login endpoint that validates credentials and establishes an authenticated session.

#### Scenario: Successful login
- **WHEN** a user submits valid credentials
- **THEN** the system returns an authenticated response with an HttpOnly session cookie

### Requirement: Session validation
The backend SHALL provide a session validation endpoint that confirms the current user session and returns user identity details.

#### Scenario: Valid session
- **WHEN** a client calls the session validation endpoint with a valid session cookie
- **THEN** the response confirms the user identity and session validity

### Requirement: Protected API access
All non-public API routes MUST require authentication and return 401 for unauthenticated requests.

#### Scenario: Unauthorized request
- **WHEN** a client requests a protected route without a valid session
- **THEN** the response status is 401

### Requirement: Auth UI pages
The frontend SHALL provide SvelteKit pages for registration and login flows.

#### Scenario: Accessing auth pages
- **WHEN** a user navigates to the login or registration page
- **THEN** the page renders a form for the corresponding auth flow
