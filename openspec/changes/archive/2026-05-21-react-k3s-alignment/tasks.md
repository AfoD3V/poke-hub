## 1. Tests (Failing) — Write First

- [x] 1.1 In `ui/src/lib/apiProxy.ts`, grep for `BACKEND_URL` occurrences and note the count. Write a Vitest test (or note in existing tests) asserting that `proxyGet/proxyPost/proxyDelete` read `process.env.API_BASE_URL`. **Verify:** `bun run test` in `ui/` reports the test as failing (env var not yet renamed).

## 2. Source Rename — `BACKEND_URL` → `API_BASE_URL`

- [x] 2.1 Rename in `ui/src/lib/apiProxy.ts`: replace all `process.env.BACKEND_URL` with `process.env.API_BASE_URL`. **Verify:** `grep -r BACKEND_URL ui/src/lib/` returns no matches.
- [x] 2.2 Rename in auth Server Actions: `ui/src/app/auth/login/actions.ts` and `ui/src/app/auth/register/actions.ts`. **Verify:** `grep -r BACKEND_URL ui/src/app/auth/` returns no matches.
- [x] 2.3 Rename in API route handlers: `ui/src/app/api/auth/login/route.ts` and `ui/src/app/api/auth/register/route.ts`. **Verify:** `grep -r BACKEND_URL ui/src/app/api/` returns no matches.
- [x] 2.4 Rename in Server Components: `app/(app)/home/page.tsx`, `app/(app)/collection/page.tsx`, `app/(app)/search/page.tsx`, `app/(app)/admin/page.tsx`, `app/(app)/admin/cache/page.tsx`, `app/(app)/admin/users/page.tsx`, `app/(app)/admin/users/[id]/page.tsx`. **Verify:** `grep -r BACKEND_URL ui/src/app/` returns no matches.
- [x] 2.5 Final sweep: run `grep -r BACKEND_URL ui/src/` from repo root. **Verify:** zero results.

## 3. Dockerfile Updates

- [x] 3.1 In `ui/Dockerfile`, change `ENV BACKEND_URL=http://pokehub-api:3000` → `ENV API_BASE_URL=http://api-svc:3000`. **Verify:** `grep BACKEND_URL ui/Dockerfile` returns no matches.
- [x] 3.2 In `ui/Dockerfile`, change `ENV PORT=3000` → `ENV PORT=4000` and `EXPOSE 3000` → `EXPOSE 4000`. **Verify:** `grep -E "PORT|EXPOSE" ui/Dockerfile` shows 4000 only.

## 4. docker-compose.yml Update

- [x] 4.1 In `docker-compose.yml`, find the `ui` service env block and rename `BACKEND_URL: http://api:3000` → `API_BASE_URL: http://api:3000` (URL value stays the same — compose service name is `api`). **Verify:** `grep BACKEND_URL docker-compose.yml` returns no matches.

## 5. Verification

- [x] 5.1 Run `bun run test` in `ui/`. **Verify:** all tests pass, including the test from §1.1 (now green).
- [x] 5.2 Run `npm run check` in `ui/`. **Verify:** zero TypeScript errors.
- [x] 5.3 Run `bun run lint` from repo root. **Verify:** zero ESLint errors.
- [x] 5.4 Run `helm lint helm/` from repo root. **Verify:** exits 0 (Helm chart unchanged, just confirming).
- [x] 5.5 Run `docker compose up -d --build` from repo root. **Verify:** build completes without errors.

## 6. Human Validation

- [x] 6.1 After `docker compose up`, open `http://localhost:4000`. **Verify:** login page loads with no console errors.
- [x] 6.2 Log in with test credentials (`claude@pokehub.dev` / `Claude123!`). **Verify:** redirects to `/home` and stats are visible.
- [x] 6.3 Navigate to `/search`, search for "pikachu". **Verify:** card results appear (confirms `API_BASE_URL` proxy works).
- [x] 6.4 Navigate to `/collection`. **Verify:** collection renders without 502 errors in the network tab.
- [x] 6.5 Log out. **Verify:** redirected to `/auth/login`, session cookie cleared.
