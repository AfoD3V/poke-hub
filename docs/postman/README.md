# Postman Collection

## Import

1. Open Postman.
2. Import `docs/postman/pokehub.postman_collection.json`.
3. Keep the collection variables or adjust as needed:
   - `baseUrl` (default `http://localhost:3000`)
   - `email`
   - `password`
   - `displayName`

## Recommended Run Order

1. Health - Status
2. Auth - Register (Positive)
3. Auth - Login (Positive)
4. Auth - Session (Positive)
5. Auth - Session (Negative)
6. Auth - Login (Negative)
7. Collection - Protected (Positive)
8. Collection - Protected (Negative)
9. Auth - Logout

## Notes

- The register request sets a unique email each run.
- The login request stores the session cookie in `sessionCookie`.
- Session requests use `sessionCookie` for auth.
