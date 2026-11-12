# GetLaunched Autotest

Playwright end-to-end test suite for the GetLaunched app. Tests exercise a single project, **"Autotest Project"**, walking through Magic Triangle, Operations, Risk analysis, Action plan and MVP end to end. This project is bootstrapped automatically on every run by `tests/auth.setup.js` (via `tests/helpers/project.js`): if it doesn't exist yet, it's created through the real UI; if the account can't create a new project (e.g. no active subscription), an existing leftover-looking project is adopted and renamed to it instead. The suite never depends on any specific pre-existing project — see "Test data and idempotency" below.

## Install dependencies

```bash
npm install
npx playwright install chromium
```

## Configuration — one place for environment + account

Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

```env
BASE_URL=https://frontv2.getlaunched.io   # or your DEV/local URL
TEST_USER_EMAIL=...
TEST_USER_PASSWORD=...
TEST_PROJECT_NAME=Autotest Project        # optional — defaults to this
```

`.env` is gitignored and loaded automatically by `playwright.config.ts` (via
`dotenv`) and by the standalone scripts in `scripts/`. Every spec/helper
navigates with relative paths (`page.goto('/sign-in')`,
`tests/helpers/navigation.js`'s `gotoClients()`, etc.) against Playwright's
configured `baseURL` — nothing hardcodes a host — and every spec reads
credentials/data from `tests/config.js`, which reads these same variables.
So changing `.env` and re-running is enough to point the **entire suite** at
a different environment or account; no spec file needs editing. A real
shell-exported env var (e.g. `BASE_URL=... npx playwright test`) still takes
precedence over `.env`, for one-off overrides.

The original variable names (`TEST_EMAIL`, `TEST_PASSWORD`, `TEST_PROJECT`)
still work as fallback aliases if you already have those set.

## Choosing the target environment (prod vs local)

The app under test is selected by the `BASE_URL` env var (see `playwright.config.ts`). It defaults to **prod** when unset:

```bash
# Prod (default) — https://frontv2.getlaunched.io
npx playwright test --project=chromium

# Local dev build
BASE_URL=https://local.getlaunched.io:3000 npx playwright test --project=chromium
```

### Running against a local frontend

The local frontend still needs a backend. It reads its API base from `VITE_BACK_API_LINK` (in the `web` repo's `.env`). Point that at the **prod API** so the test account exists:

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

Login and test data are centralized in `tests/helpers.js` / `tests/config.js` (`login()` + `EMAIL`/`PASSWORD`/`PROJECT_NAME` and every other reusable fixture-data constant). `tests/config.js` has no hardcoded credentials — it reads `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` from the environment and throws a clear error at startup if either is missing, so set them via `.env` (see above) or the shell:

```bash
TEST_USER_EMAIL=... TEST_USER_PASSWORD=... TEST_PROJECT_NAME="My Autotest Project" npx playwright test
# the original TEST_EMAIL/TEST_PASSWORD/TEST_PROJECT names still work as fallbacks
```

A `setup` project (`tests/auth.setup.js`) logs in **once** through the UI, saves `storageState.json`, and bootstraps `TEST_PROJECT_NAME` (creating or adopting it — see above) via `tests/helpers/project.js`, writing its `{id, name}` to `tests/.auth/run-context.json`. The `chromium` project then reuses that session and run context: specs import `test`/`expect` from `tests/fixtures/project.fixture.js` to get a `project` fixture instead of searching the project list by name, and use `tests/helpers/navigation.js` for direct URL navigation into it. Each spec still calls `login(page)`, which is a no-op when already authenticated.

`01-login.spec.js` intentionally opts out of the shared session (`test.use({ storageState: { cookies: [], origins: [] } })`) so it can exercise the sign-in form from a clean state.

To regenerate the session manually (rarely needed): `node scripts/saveStorageState.js`.

## Test data and idempotency

Every test runs against the bootstrapped **"Autotest Project"** on the live backend — there is no seeded/disposable environment. Every created record uses a `unique()` name (`tests/config.js`) so re-runs never collide with prior data, and specs create the state they need themselves via `tests/helpers/*.helper.js` rather than depending on another numbered file having run first (an edit/delete spec creates its own fixture record). Leaf entities with no downstream reference (competitors, evaluation criteria, marketing channels, resources, risks, action-plan stages/tasks, MVPs) still accumulate across runs since there's no teardown yet — see `TESTING_IMPROVEMENTS.md`.

## Test structure

Tests are numbered in the order they should run, since later ones frequently depend on data created earlier (a client from `04`, a team member from `14`, etc.).

### Onboarding
| File | Covers |
|---|---|
| `00-onboarding-new-account.spec.js` | New-project onboarding flow (create → configure → verify → clean up its own throwaway project) |

### Magic Triangle
| File | Covers |
|---|---|
| `01-login.spec.js` | Login |
| `02-create-project.spec.js` | Create project |
| `03-edit-project.spec.js` | Edit project |
| `04-create-client.spec.js` | Create clients + needs (verified on the segment card's Job/Pain/Gain columns) |
| `06-create-product.spec.js` | Create products (3-step wizard: General → Pricing → Clients; all 5 revenue types) |
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
| `18-create-other.spec.js` | IP Rights (Have it / Planned / Not relevant), Location Analysis, Supplier Analysis |
| `19-edit-other.spec.js` | Edit IP Rights / locations / suppliers |

### Risk analysis, Action plan, MVP
| File | Covers |
|---|---|
| `20-create-risk-analysis.spec.js` | Create risks (all PESTEL categories, Probability × Consequences spread) |
| `21-edit-risk-analysis.spec.js` | Edit risks; risk matrix hover tooltip |
| `22-create-action-plan.spec.js` | Action plan board: add stages, create tasks, drag & drop |
| `23-edit-action-plan.spec.js` | Edit action items |
| `24-create-mvp.spec.js` | Create an MVP for each of the 5 MVP types |
| `25-edit-mvp.spec.js` | Edit MVPs |

### Overview, reporting & account
| File | Covers |
|---|---|
| `26-dashboard.spec.js` | Dashboard widgets, header links, invite button |
| `27-magic-triangle-overview.spec.js` | Magic Triangle overview page, AI insights, auto-analyze |
| `28-financial-forecasts.spec.js` | Financial forecasts stat tiles/chart, Income/Cash flow/Balance sheet tabs |
| `29-financial-funding.spec.js` | Working capital calculator, Funding & Capital section |
| `30-business-plan.spec.js` | Generated business plan document sections, section navigation |
| `31-invite.spec.js` | Team invite modal: role dropdown, email validation, cancel |
| `32-minor-global-settings.spec.js` | Notifications panel, language switcher, learning center link |
| `33-clients-screen.spec.js` | Clients screen segment cards: legend, need columns (sort/collapse), need card + canvas links, add per category, coverage, edit (name/description, delete a need), delete segment, responsive stacking |

## Known quirks

These are real behaviors found while writing the suite — worth knowing before touching the tests:

- **Default test timeout (30s) is too tight for multi-item loops.** Any test that creates several records in one `test()` call needs an explicit `test.setTimeout(...)`.
- **`page.waitForLoadState('networkidle')` can hang for the entire test budget.** The app never truly goes network-idle (background polling), so always pass an explicit `{ timeout }`.
- **Custom dropdowns follow one consistent pattern** across the whole app: a trigger button `button[data-open="false"]` → `getByRole('listbox')` → `getByRole('option')`.
- **Action plan drag-and-drop does not work with Playwright's native `dragTo()`.** It requires a manual multi-step `mouse.down()` → several `mouse.move()` steps → `mouse.up()` sequence (see `dragCardToColumn` in `22-create-action-plan.spec.js`).
- **Action plan "Edit action item" form: changing the Stage dropdown does not persist on Update.** Moving a task between stages only works via drag-and-drop on the board.
- **Resources:** Investment uses a single Year + Useful life + Investment amount; a Running cost's per-year cost field is rejected by validation for any year before the resource's Start year. Running costs must be created from the "Running costs" list filter — switching type inside the drawer is broken (see `BUG_PATTERNS.md`).
- **MVP creation requires at least one Key feature of type "Core"** — an MVP with only "Optional" features fails to submit.
- **IP Rights nav buttons carry a status badge** (e.g. "Patent Filed"), so match by prefix (`/^Trademark\b/`) rather than an exact label. Never press Escape inside the Other tab — it collapses the accordion.

## Notes

- Playwright `^1.58.2`, Chromium only (`playwright.config.ts`)
- Reporter: HTML, written to `playwright-report/`
- `.gitignore` excludes `storageState.json`, `test-results/`, and `playwright-report/` — session tokens and report churn are not committed.
- `.claude/` holds Claude Code rules, a skill, and a subagent to make writing/maintaining these tests easier.
