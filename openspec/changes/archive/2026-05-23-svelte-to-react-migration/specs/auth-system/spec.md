## MODIFIED Requirements

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
