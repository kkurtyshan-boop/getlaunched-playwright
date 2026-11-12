# CLAUDE.md — GetLaunched Playwright suite

Guidance for Claude Code when working in this test repo.

## What this is

Playwright E2E suite for the GetLaunched app. Numbered specs drive one
bootstrapped project, **"Autotest Project"**, through Magic Triangle →
Operations → Risk analysis / Action plan. No seeded DB, no teardown — tests run against a
live backend. The project itself is created (or adopted from an existing
leftover project, if the account can't create a new one) automatically by
`tests/auth.setup.js` — see `tests/helpers/project.js`. Specs never depend on
"Dior Brand" or any other specific pre-existing project.

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
2. **Never hardcode credentials.** Import `EMAIL`, `PASSWORD`, `PROJECT_NAME`
   (and fixture-data values like `PRODUCT_NAME`, `unique()`) from
   `tests/config.js` — `tests/helpers.js` re-exports the credentials for older
   imports. `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` have no default: copy
   `.env.example` to `.env`, otherwise the suite throws at startup.
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
mouse sequence, MVP needs a "Core" feature, IP Rights nav buttons carry a
status badge, etc.). UI changes confirmed on 2026-11-11 are summarized in
`PROJECT_KNOWLEDGE.md` §0.

## Data hygiene

Create flows are **not idempotent** and there is no teardown, so re-runs pile up
duplicate records on the live project. When adding create-tests, suffix names
with a unique marker and prefer a matching delete step. See
`TESTING_IMPROVEMENTS.md` for the broader plan.

# QA Testing Workflow

Whenever a testing request is received — e.g. "Test Products", "Test
Clients", "Test Competitors", "Run release testing" — always follow this
workflow automatically, in order:

1. Review previous report (if available).
2. Compare UI with Figma.
3. Report UI inconsistencies.
4. Perform functional testing.
5. Generate Markdown report.

This order is non-negotiable — never start functional testing before the
Figma comparison step has been done and its findings logged.

## 1. Review previous report (if available)

Before starting any testing, check `test-reports/` for an existing report
matching the feature/flow under test (e.g. `Products_Test_Report.md` for
"Test Products"). If one exists, review its Found Bugs, Release
Recommendation, and Conclusion sections so this session builds on prior
findings instead of starting blind. If none exists, proceed without one —
don't fabricate history.

## 2. Compare UI with Figma

Before any functional testing, compare the current UI for the feature/flow
under test against its corresponding Figma design. Check spacing,
typography, colors, icons, alignment, copy, and responsive behavior against
the design. If no Figma reference is available for this feature, say so
explicitly rather than skipping the comparison silently.

## 3. Report UI inconsistencies

Log every discrepancy found between the live UI and the Figma design as a
UI/UX Observation (or as a Bug if it also breaks functionality) before
moving on to functional testing, so visual issues aren't lost among
functional findings later.

## 4. Perform functional testing

### 4a. Read the app knowledge base first

Read `.claude/skills/new-spec/PROJECT_KNOWLEDGE.md` to understand the
project's modules, business rules, cross-module dependencies, and
implementation details already discovered.

### 4b. Use the release checklist as the primary test plan

Work from `.claude/skills/new-spec/RELEASE_CHECKLIST.md`. Always cover every
section applicable to the requested feature/module — Happy Path, Validation,
Negative Scenarios, Edge Cases, Permissions, Navigation, UI, Regression, and
Performance Observations. Don't skip a category just because it seems
unlikely to matter for this particular request.

### 4c. Review known regressions before testing

Review `.claude/skills/new-spec/BUG_PATTERNS.md`. Re-test every known
regression relevant to the module being tested rather than rediscovering the
same quirks/limitations from scratch.

### 4d. What to verify during testing

- new functionality under test
- related/dependent functionality (per `PROJECT_KNOWLEDGE.md`'s cross-module
  relationships)
- regression testing where applicable
- UI/UX consistency
- happy path, negative scenarios, validations, permissions, navigation,
  edge cases, and error handling

## 5. Logging newly confirmed bugs

If a new confirmed bug is found, automatically append it to
`.claude/skills/new-spec/BUG_PATTERNS.md`, following that file's existing
template and maintenance rules:

- never overwrite or delete a previous entry — this file is permanent
  historical memory
- update an existing entry only when its status actually changes (e.g.
  Open → Fixed)
- new entries go at the top of both the detailed section and the
  "Regression Checklist" index

## 6. Generate a Markdown test report after every session

After every completed testing session, automatically generate a Markdown
(.md) report inside the `test-reports/` folder at the repo root (create the
folder if it doesn't exist yet). The report filename must match the tested
feature or flow, e.g.:

- Project_Creation_Test_Report.md
- Clients_Test_Report.md
- Products_Test_Report.md
- Competitors_Test_Report.md
- Team_and_Staff_Test_Report.md
- Resources_Test_Report.md
- Risk_Analysis_Test_Report.md

Always generate the report, even if no bugs were found. Do not duplicate
report-generation across multiple rules — this is the single, consistent
workflow for it.

## 7. Delivering the report

Do NOT paste the report's full content into the chat, and do not
automatically download or export it — it stays as a Markdown file inside
`test-reports/` until the user decides to open, download, or ignore it.

Reply only with:

```
✅ Testing completed.
📄 Markdown Test Report has been successfully generated.
```

Then attach the generated Markdown file to the conversation so the user can
preview it, download it, or ignore it.

## Report structure

The report must contain the following sections.

```
# Test Report

## Test Title
The full name of the tested feature or flow.

## General Information
- Date
- Time
- Environment
- Build Version
- Browser or Device
- Environment URL (if available)

## Scope
Briefly list everything that was tested, e.g.:
- Create Product
- Edit Product
- Delete Product
- Field Validation
- Navigation
- Error Handling
- Edge Cases
- UI/UX

# Test Result Summary
- Total test scenarios executed
- Passed
- Failed
- Blocked (if any)
- Not Tested (if any)

# Found Bugs
One section per bug:

## Bug #1
### Title
A short and clear bug title.
### Severity
Critical / Major / Minor / Trivial
### Priority
High / Medium / Low
### Description
A concise description of the issue.
### Steps to Reproduce
Numbered reproduction steps.
### Expected Result
### Actual Result
### Why This Is a Bug
Which expected behavior, business logic, usability rule, or requirement is violated.

# UI/UX Observations
Spacing, typography, color, icon, alignment, and responsive layout issues —
including discrepancies found during the Figma comparison pass — listed
separately from functional bugs.

# Potential Risks
Possible regressions, impact on end users, data loss risk, unstable
functionality, potential side effects — if the discovered issues may affect
other modules or the upcoming release.

# Release Recommendation
Choose exactly one, with a brief explanation:
✅ Ready for Release
⚠️ Ready with Known Issues
❌ Not Ready for Release

# Conclusion
A concise, professional conclusion from the perspective of a Senior QA
Engineer: overall quality of the tested functionality, whether it's ready
for release, what should be additionally verified, and which areas carry
the highest risk.
```

## Report content rules

- Never invent bugs.
- If an issue cannot be reproduced or confirmed, do not include it in the
  report.
- If something could not be tested due to environment limitations, clearly
  mention it.
- Do not duplicate the same defect; merge similar issues into a single bug
  if they share the same root cause.
- Write in professional English suitable for Jira, Linear, Azure DevOps, or
  any other issue tracking system.
- The report should require no additional editing before being shared with
  the team.
