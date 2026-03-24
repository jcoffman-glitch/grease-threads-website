# Playwright E2E Test Setup

## Test Users

Three Google Workspace test users have been created:

| User | Email | Role |
|---|---|---|
| Test Admin | gnt-test-admin@greasethreads.com | admin |
| Test Technician | gnt-test-tech@greasethreads.com | technician |
| Test Customer | gnt-test-customer@greasethreads.com | customer |

These are mapped in `src/lib/auth.ts` to their respective roles.

## Current Auth Approach: TEST_AUTH_BYPASS

Tests authenticate via a test-only API route at `/api/auth/test-session`:

- **Only active** when `TEST_AUTH_BYPASS=true` env var is set
- Returns 403 in production (when env var is not set)
- Creates a signed NextAuth JWT using `jose` and the same `NEXTAUTH_SECRET`
- Sets the `next-auth.session-token` cookie directly

This bypasses Google OAuth entirely, allowing E2E tests to run without real Google credentials.

### Security

- `TEST_AUTH_BYPASS` must **NEVER** be set in the production Vercel environment
- The route checks `process.env.TEST_AUTH_BYPASS === 'true'` and returns 403 otherwise
- JWTs are signed with the real `NEXTAUTH_SECRET` so NextAuth accepts them

## DWD Upgrade Path

To test with real Google tokens (full OAuth flow), configure Domain-Wide Delegation:

### Steps

1. Go to **Google Admin Console** → **Security** → **API Controls** → **Domain-Wide Delegation**

2. Add a new client:
   - **Service Account**: `gnt-admin@grease-and-threads.iam.gserviceaccount.com`
   - **Client ID**: `112951906768926728772`
   - **Scopes**:
     ```
     https://www.googleapis.com/auth/userinfo.email
     https://www.googleapis.com/auth/userinfo.profile
     openid
     ```

3. Once DWD is enabled, the test helper can impersonate Workspace users to obtain real Google ID tokens, enabling full OAuth flow testing.

4. Update `tests/e2e/helpers/auth.ts` to use DWD-based token acquisition when a service account key is available, falling back to `TEST_AUTH_BYPASS` otherwise.

## GitHub Actions Secrets

The following secrets must be configured in the GitHub repository settings for CI:

| Secret | Description |
|---|---|
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret |
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `GOOGLE_WEB_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_WEB_CLIENT_SECRET` | Google OAuth client secret |
| `ADMIN_USERNAME` | Admin credentials username |
| `ADMIN_PASSWORD` | Admin credentials password |

`TEST_AUTH_BYPASS` is set to `'true'` directly in the workflow file (not a secret).
`BASE_URL` defaults to `http://localhost:3000` in CI.
