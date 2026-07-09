# GetLaunched Autotest

Playwright end-to-end test suite for the GetLaunched app (`https://frontv2.getlaunched.io`). All tests exercise a single live demo project, **"Dior Brand"**, walking through Magic Triangle, Operations, and Implementation end to end.

## Install dependencies

```bash
npm install
```

## Running tests

Run the whole suite exactly as used day-to-day:

```bash
npx playwright test --project=chromium --headed --workers=1
```

`playwright.config.ts` already defaults to `workers: 1` and `headless: false`, so these flags are mostly explicit reinforcement — they can be omitted and the behavior stays the same.

Other useful invocations:

```bash
# Whole suite via npm scripts
npm test              # headless
npm run test:headed   # headed

# A single file
npx playwright test tests/04-create-client.spec.js --project=chromium

# A single test by title (grep)
npx playwright test --project=chromium -g "01. Validation"
```

## Authentication

Each spec file logs in through the UI itself via its own `login()` helper (credentials are hardcoded: `kataratest573@gmail.com`). There is no shared `auth.setup.js` — every file is self-contained.

`storageState.json` is a saved session used to skip the login screen where a spec file opts into it. Regenerate it with:

```bash
node scripts/saveStorageState.js
```

## Test data and idempotency

Every test runs against the **live** "Dior Brand" project — there is no seeded/disposable test environment and no teardown step. Most "create" flows are **not idempotent**: re-running the full suite from a fresh state adds new clients, products, competitors, channels, etc. on top of whatever already exists. This is the accepted behavior for this suite; don't be surprised by duplicate-looking records when re-running tests that were already run before.

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
- Each spec file is self-contained (its own `login()`, navigation helpers, etc.) — there are no shared imports between spec files, by convention
- `storageState.json` and `test-results/`/`playwright-report/` output are currently committed to git; consider adding a `.gitignore` before pushing new session tokens or churn-y report artifacts
