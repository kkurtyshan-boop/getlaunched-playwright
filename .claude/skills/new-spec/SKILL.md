---
name: new-spec
description: Scaffold a new Playwright spec for the GetLaunched suite following repo conventions (shared login helper, relative goto, role-based locators, no fixed sleeps). Use when the user asks to add a new test, cover a new page/feature, or create a new spec file.
---

# Scaffold a new spec

Follow these steps when creating a new spec in `tests/`.

## 1. Pick the number and name

Specs are numbered by run order because later ones depend on data created
earlier. Insert the new file at the right point: `NN-<verb>-<feature>.spec.js`
(e.g. `26-create-financials.spec.js`). Ask the user where it belongs if unclear.

## 2. Start from this template

```js
import { test, expect } from '@playwright/test';
import { login, PROJECT_NAME } from './helpers';

// Navigate from the project list to the page under test.
async function openFeature(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const projectCard = page.getByText(PROJECT_NAME, { exact: true }).first();
  await expect(projectCard).toBeVisible({ timeout: 15000 });
  await projectCard.click();

  // ... click into the relevant section/tab, assert a heading is visible ...
}

test.describe.serial('<Feature> flow', () => {
  test('01. Validation on empty form', async ({ page }) => {
    await login(page);            // no-op when storageState is present
    await openFeature(page);
    // open create modal, submit empty, assert the validation message
  });

  test('02. Create <thing>', async ({ page }) => {
    // If this creates several records in a loop, raise the budget:
    // test.setTimeout(120_000);
    await login(page);
    await openFeature(page);
    // fill fields, submit, assert the created record appears (scoped, not body)
  });
});
```

## 3. Rules to honor (see .claude/CLAUDE.md for the full list)

- Relative `page.goto('/...')` only — never a literal host.
- `login`/creds come from `./helpers` — never redefine or hardcode them.
- Locators: `getByRole` / `getByPlaceholder` / `getByText`. Avoid `.nth()` on
  generic tags; if no stable hook exists, ask for a `data-testid`.
- Custom dropdown: `button[data-open="false"]` → `getByRole('listbox')` →
  `getByRole('option')`.
- No `page.waitForTimeout(...)` — wait on a concrete signal.
- Bound every `networkidle` wait with `{ timeout }`.
- Scope success assertions to the modal/card, not `page.locator('body')`.
- Give create-in-a-loop tests an explicit `test.setTimeout(...)`.

## 4. Verify

- `npx playwright test --list` — confirms it parses.
- Run it locally: `BASE_URL=https://local.getlaunched.io:3000 HEADLESS=1 npx playwright test tests/<file> --project=chromium`.
- Then hand the file to the `playwright-test-reviewer` agent for a convention check.
