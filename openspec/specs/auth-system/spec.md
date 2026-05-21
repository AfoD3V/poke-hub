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
The frontend SHALL provide Next.js pages (App Router `page.tsx`) for registration and login flows. Login and register pages SHALL use React `<form>` elements bound to Next.js Server Actions. There SHALL be no client-side `fetch` for auth — all credential submission goes through Server Actions.

#### Scenario: Accessing auth pages
- **WHEN** a user navigates to `/auth/login` or `/auth/register`
- **THEN** the page renders a form for the corresponding auth flow

#### Scenario: Login form uses Server Action
- **WHEN** the login form is submitted
- **THEN** the Server Action `login(formData)` is invoked server-side (no client fetch to `/api/auth`)

#### Scenario: Register form uses Server Action
- **WHEN** the register form is submitted
- **THEN** the Server Action `register(formData)` is invoked server-side
