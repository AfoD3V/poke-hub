## MODIFIED Requirements

### Requirement: Login Server Action sets HttpOnly JWT cookie
A Next.js Server Action `login(formData: FormData)` SHALL exist in `ui/src/app/auth/login/actions.ts`. It SHALL POST credentials to `API_BASE_URL/auth/login`, extract the `Set-Cookie` header from the Hono response, and set the cookie via Next.js `cookies().set()` with the same `httpOnly`, `sameSite`, `path`, and `maxAge` values. On success it SHALL call `redirect('/home')`.

#### Scenario: Successful login sets cookie and redirects
- **WHEN** valid credentials are submitted via the login form
- **THEN** the `pokehub_session` HttpOnly cookie is set in the browser and the user is redirected to `/home`

#### Scenario: Invalid credentials returns error message
- **WHEN** invalid credentials are submitted
- **THEN** the login page re-renders with a user-facing error message and no cookie is set

#### Scenario: Cookie attributes preserved
- **WHEN** a successful login occurs
- **THEN** the `pokehub_session` cookie has `httpOnly: true`, `sameSite: strict`, and `path: /`

### Requirement: Register Server Action creates account and sets cookie
A Server Action `register(formData: FormData)` SHALL exist in `ui/src/app/auth/register/actions.ts`. It SHALL POST registration data to `API_BASE_URL/auth/register`, set the JWT cookie on success, and redirect to `/home`.

#### Scenario: Successful registration sets cookie and redirects
- **WHEN** valid registration data is submitted
- **THEN** the `pokehub_session` cookie is set and the user is redirected to `/home`

#### Scenario: Duplicate email returns error
- **WHEN** an already-registered email is submitted
- **THEN** the register page re-renders with a duplicate-email error message

### Requirement: Session cookie forwarded to Hono on server-side data fetches
All Server Components that fetch from `API_BASE_URL` SHALL include the `cookie` header from Next.js `headers()` in the upstream request. This ensures Hono can validate the session for server-side rendered data.

#### Scenario: Server Component fetch includes cookie
- **WHEN** `/home` is rendered server-side for an authenticated user
- **THEN** the fetch to `API_BASE_URL/api/collection` includes the `pokehub_session` cookie header and returns 200 (not 401)

#### Scenario: Missing cookie yields 401 from Hono
- **WHEN** a Server Component fetch omits the cookie header
- **THEN** Hono returns 401 and the Server Component handles it by redirecting to `/auth/login`
