# GetLaunched Autotest

Playwright end-to-end test suite for the GetLaunched app. All tests exercise a single live demo project, **"Dior Brand"**, walking through Magic Triangle, Operations, and Implementation end to end.

## Install dependencies

```bash
npm install
npx playwright install chromium
```

## Choosing the target environment (prod vs local)

The app under test is selected by the `BASE_URL` env var (see `playwright.config.ts`). It defaults to **prod** when unset:

```bash
# Prod (default) — https://frontv2.getlaunched.io
npx playwright test --project=chromium

# Local dev build
BASE_URL=https://local.getlaunched.io:3000 npx playwright test --project=chromium
```

### Running against a local frontend

The local frontend still needs a backend. It reads its API base from `VITE_BACK_API_LINK` (in the `web` repo's `.env`). Point that at the **prod API** so the "Dior Brand" project and the test account exist:

1. In the `web` repo: `bun run dev` (serves `https://local.getlaunched.io:3000`).
2. Use `BASE_URL=https://local.getlaunched.io:3000`.

> Use the `local.getlaunched.io` host, **not** `localhost`. The prod API scopes its auth cookie to `.getlaunched.io` and its CORS allow-list to `*.getlaunched.io`, so `localhost` would fail auth/CORS. `local.getlaunched.io` must resolve to `127.0.0.1` (hosts file). The dev server uses a self-signed cert; `ignoreHTTPSErrors` is already set in the config.

## Running tests

```bash
npm test              # whole suite, prod
npm run test:headed   # whole suite, headed

# Single file
npx playwright test tests/04-create-client.spec.js --project=chromium

# Single test by title
npx playwright test --project=chromium -g "01. Validation"

# Headless (CI)
HEADLESS=1 npx playwright test --project=chromium
```

`playwright.config.ts` defaults to `workers: 1` and headed mode (set `HEADLESS=1` for CI).

## Authentication

Login is centralized in `tests/helpers.js` (`login()` + `EMAIL`/`PASSWORD`/`PROJECT_NAME`). Credentials default to the shared test account but can be overridden without touching code:

```bash
TEST_EMAIL=... TEST_PASSWORD=... TEST_PROJECT="Dior Brand" npx playwright test
```

A `setup` project (`tests/auth.setup.js`) logs in **once** through the UI and saves `storageState.json`; the `chromium` project then reuses that session, so individual specs don't re-login through the UI. Each spec still calls `login(page)`, which is a no-op when already authenticated.

`01-login.spec.js` intentionally opts out of the shared session (`test.use({ storageState: { cookies: [], origins: [] } })`) so it can exercise the sign-in form from a clean state.

To regenerate the session manually (rarely needed): `node scripts/saveStorageState.js`.

## Test data and idempotency

Every test runs against the **live** "Dior Brand" project — there is no seeded/disposable test environment and no teardown. Most "create" flows are **not idempotent**: re-running the suite adds new clients, products, competitors, channels, etc. on top of whatever exists. Expect duplicate-looking records on re-runs. See `TESTING_IMPROVEMENTS.md` for the plan to address this.

## Test structure

Tests are numbered in the order they should run, since later ones frequently depend on data created earlier (a client from `04`, a team member from `14`, etc.).

### Magic Triangle
| File | Covers |
|---|---|
| `01-login.spec.js` | Login |
| `02-create-project.spec.js` | Create project |
| `03-edit-project.spec.js` | Edit project |
| `04-create-client.spec.js` | Create clients + needs |
| `05-edit-client-delete-need.spec.js` | Edit client, delete a need |
| `06-create-product.spec.js` | Create products (2-step wizard: Product → Attach clients) |
| `07-edit-product-add-delete-client.spec.js` | Edit product, add/remove attached client |
| `08-create-competitor-analysis.spec.js` | Create competitors |
| `09-create-evaluation-criteria.spec.js` | Create evaluation criteria |
| `10-create-evaluation-matrix.spec.js` | Fill evaluation matrix scores |
| `11-edit-delete-competitor.spec.js` | Edit and delete a competitor |

### Operations
| File | Covers |
|---|---|
| `12-create-marketing-channels.spec.js` | Create marketing channels (all categories) |
| `13-edit-marketing-channels.spec.js` | Edit marketing channels |
| `14-create-team-and-staff.spec.js` | Create key members + line staff |
| `15-edit-team-and-staff.spec.js` | Edit team and staff |
| `16-create-resources.spec.js` | Create resources (Investment + Running costs, all categories) |
| `17-edit-resources.spec.js` | Edit resources |
| `18-create-other.spec.js` | IP Rights, Location Analysis, Supplier Analysis |
| `19-edit-other.spec.js` | Edit IP Rights / locations / suppliers |

### Implementation
| File | Covers |
|---|---|
| `20-create-risk-analysis.spec.js` | Create risks (all PESTEL categories, Probability × Consequences spread) |
| `21-edit-risk-analysis.spec.js` | Edit risks; risk matrix hover tooltip |
| `22-create-аction-plan.spec.js` | Action plan board: add stages, create tasks, drag & drop |
| `23-edit-action-plan.spec.js` | Edit action items |
| `24-create-mvp.spec.js` | Create an MVP for each of the 5 MVP types |
| `25-edit-mvp.spec.js` | Edit MVPs |

## Known quirks

These are real behaviors found while writing the suite — worth knowing before touching the tests:

- **Default test timeout (30s) is too tight for multi-item loops.** Any test that creates several records in one `test()` call needs an explicit `test.setTimeout(...)`.
- **`page.waitForLoadState('networkidle')` can hang for the entire test budget.** The app never truly goes network-idle (background polling), so always pass an explicit `{ timeout }`.
- **Custom dropdowns follow one consistent pattern** across the whole app: a trigger button `button[data-open="false"]` → `getByRole('listbox')` → `getByRole('option')`.
- **Action plan drag-and-drop does not work with Playwright's native `dragTo()`.** It requires a manual multi-step `mouse.down()` → several `mouse.move()` steps → `mouse.up()` sequence (see `dragCardToColumn` in `22-create-аction-plan.spec.js`).
- **Action plan "Edit action item" form: changing the Stage dropdown does not persist on Update.** Moving a task between stages only works via drag-and-drop on the board.
- **Resources: "Amortization period" has a max value of 100**, and a Running cost's per-year cost field is rejected by validation for any year before the resource's Start year.
- **MVP creation requires at least one Key feature of type "Core"** — an MVP with only "Optional" features fails to submit.
- **IP Rights nav buttons carry a status badge** (e.g. "Trademark Planned"), so match by prefix (`/^Trademark\b/`) rather than an exact label.

## Notes

- Playwright `^1.58.2`, Chromium only (`playwright.config.ts`)
- Reporter: HTML, written to `playwright-report/`
- `.gitignore` excludes `storageState.json`, `test-results/`, and `playwright-report/` — session tokens and report churn are not committed.
- `.claude/` holds Claude Code rules, a skill, and a subagent to make writing/maintaining these tests easier.
