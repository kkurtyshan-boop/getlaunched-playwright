# CLAUDE.md — GetLaunched Playwright suite

Guidance for Claude Code when working in this test repo.

## What this is

Playwright E2E suite for the GetLaunched app. 25 numbered specs drive one live
demo project, **"Dior Brand"**, through Magic Triangle → Operations →
Implementation. No seeded DB, no teardown — tests run against a live backend.

## Commands

```bash
npm install && npx playwright install chromium   # first-time setup

npx playwright test --project=chromium           # prod (default)
BASE_URL=https://local.getlaunched.io:3000 npx playwright test --project=chromium   # local
HEADLESS=1 npx playwright test --project=chromium                                   # CI

npx playwright test tests/04-create-client.spec.js --project=chromium   # one file
npx playwright test --project=chromium -g "validation"                  # by title
```

## Non-negotiable conventions

1. **Never hardcode the host.** Use relative paths: `page.goto('/sign-in')`,
   `page.goto('/')`. The host comes from `BASE_URL` via `baseURL` in the config.
2. **Never hardcode credentials.** Import from `tests/helpers.js`
   (`EMAIL`, `PASSWORD`, `PROJECT_NAME`) — they read env with sane defaults.
3. **Never write a per-file `login()`.** Import `login` from `./helpers`.
   Auth runs once in `auth.setup.js`; `login()` is a no-op when a session
   already exists.
4. **Never assert on the URL host** (e.g. `toHaveURL(/getlaunched/i)`) — it
   breaks on local. Assert on the path instead (`not.toHaveURL(/\/sign-in/i)`).

## Selectors & waits

- **Prefer role/label/placeholder locators.** `getByRole`, `getByPlaceholder`,
  `getByText`. Avoid positional `.nth(n)` on generic elements — it silently
  breaks when the DOM shifts (and the app's component layer is actively
  refactored). If a stable hook is missing, request a `data-testid` from the
  app team rather than reaching for `.nth()`.
- **Custom dropdowns** follow ONE pattern app-wide:
  `button[data-open="false"]` → `getByRole('listbox')` → `getByRole('option')`.
- **Never `page.waitForLoadState('networkidle')` without a timeout** — the app
  polls in the background and never goes idle. Always
  `.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})`.
- **Avoid `page.waitForTimeout(...)`.** Fixed sleeps are the #1 source of flake.
  Wait for a concrete signal: `expect(locator).toBeVisible()`,
  `toBeEnabled()`, `toContainText()`, a URL change, or a response.
- **Scope assertions.** Prefer `expect(modal).toContainText(x)` or a specific
  card over `expect(page.locator('body')).toContainText(x)`.

## Timeouts

Any test that creates several records in one `test()` needs an explicit
`test.setTimeout(...)` — the default 30s is too tight for multi-item loops.

## Known app quirks

See the "Known quirks" section in `README.md` (drag-and-drop needs a manual
mouse sequence, MVP needs a "Core" feature, Amortization max 100, IP Rights nav
buttons carry a status badge, etc.).

## Data hygiene

Create flows are **not idempotent** and there is no teardown, so re-runs pile up
duplicate records on the live project. When adding create-tests, suffix names
with a unique marker and prefer a matching delete step. See
`TESTING_IMPROVEMENTS.md` for the broader plan.
