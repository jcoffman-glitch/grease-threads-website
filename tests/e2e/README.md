# E2E Tests — Grease & Threads

End-to-end tests using [Playwright](https://playwright.dev/).

## Running locally

```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps chromium

# Start the dev server (in another terminal, or let Playwright do it)
npm run dev

# Run all tests (headless)
TEST_AUTH_BYPASS=true npm run test:e2e

# Run with browser visible
TEST_AUTH_BYPASS=true npm run test:e2e:headed

# Interactive UI mode
TEST_AUTH_BYPASS=true npm run test:e2e:ui

# View HTML report after a run
npm run test:e2e:report
```

## Required environment variables

| Variable | Description |
|---|---|
| `TEST_AUTH_BYPASS` | **Must be `true`** for tests to authenticate. Never set in production! |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret (must match the running server) |
| `BASE_URL` | Target URL (default: `http://localhost:3000`) |
| `TURSO_DATABASE_URL` | Turso DB URL (needed if running against localhost) |
| `TURSO_AUTH_TOKEN` | Turso auth token |

Set these in a `.env.local` file or export them before running tests.

**WARNING:** `TEST_AUTH_BYPASS` must NEVER be set in the production Vercel environment. It is only for local development and CI.

## How the auth helper works

Tests use a `loginAs(page, role)` helper that:

1. Calls `POST /api/auth/test-session` with `{ role, email }`
2. The route (only active when `TEST_AUTH_BYPASS=true`) creates a signed JWT using `jose` and the same `NEXTAUTH_SECRET`
3. Sets the `next-auth.session-token` cookie on the response
4. The browser context now has a valid NextAuth session

This avoids needing real Google OAuth flows in tests. Three test users are mapped:
- `admin` → `gnt-test-admin@greasethreads.com`
- `technician` → `gnt-test-tech@greasethreads.com`
- `customer` → `gnt-test-customer@greasethreads.com`

## Test files

| File | What it covers |
|---|---|
| `auth.spec.ts` | Login, session persistence, role-based access (admin vs technician) |
| `public.spec.ts` | Home page, booking form flow, tracking page, mobile viewport |
| `admin-jobs.spec.ts` | CRUD operations on jobs (create, update, delete, detail page) |
| `technician.spec.ts` | Technician role: dashboard access, nav visibility, restricted pages |
| `api.spec.ts` | API smoke tests — auth enforcement, contact form |
| `schedule.spec.ts` | Schedule page load, empty state handling |

## CI

GitHub Actions workflow runs on push/PR to `main`. See `.github/workflows/e2e.yml`.
Secrets must be configured in the GitHub repo settings.

## Next step

DWD (Domain-Wide Delegation) setup for real Google token testing. See `PLAYWRIGHT_SETUP.md` at project root.
