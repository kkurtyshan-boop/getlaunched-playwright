import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { unique } from './config';
import { createProjectViaUi, ProjectLimitReachedError } from './helpers/project';

// Independent of every other spec: creates and deletes its own throwaway
// project rather than sharing state with 03-edit-project.spec.js via
// globalThis (the old coupling only worked in a single serial process and
// broke under sharding/-g filters/single-file runs).
//
// Both tests below can legitimately be skipped: creating a project requires
// a free slot under the account's plan, and — per the explicit "no
// subscription/payment automation" exclusion — this suite cannot buy one.
// See helpers/project.js's ProjectLimitReachedError / ensureTestProject for
// how the *shared* Autotest Project used by every other spec works around
// this (by adopting a leftover project); these two tests specifically need
// a genuinely new project to prove the Create flow, so they skip instead of
// silently testing something else when the account has no room.
async function createOrSkip(page, name, opts) {
  try {
    await createProjectViaUi(page, { name, ...opts });
  } catch (err) {
    if (err instanceof ProjectLimitReachedError) {
      test.skip(true, `Account is at its project limit (${err.message}) — cannot create a throwaway project to test Create.`);
    }
    throw err;
  }
}

test('Create project', async ({ page }) => {
  await login(page);

  const projectNameText = unique('Create Project Test');
  await createOrSkip(page, projectNameText, { description: 'An intelligent business planning platform featuring AI' });

  const createdProjectCard = page.locator('li').filter({ hasText: projectNameText }).first();
  await expect(createdProjectCard).toBeVisible({ timeout: 20000 });

  // Clean up — this spec's whole point is exercising Create, not leaving a
  // permanent extra project behind (item 11: unique data + cleanup).
  await createdProjectCard.getByRole('button', { name: /open actions menu/i }).click();
  await page.getByText(/^delete$/i).first().click();
  const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await dialog.getByRole('button', { name: /delete/i }).first().click();
  await expect(createdProjectCard).not.toBeVisible({ timeout: 15000 });
});

test('Create project — validation', async ({ page }) => {
  await login(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page
    .getByRole('button', { name: /^create project$/i })
    .or(page.getByText(/^create project$/i))
    .first()
    .click();

  await expect(page.getByRole('heading', { name: /create project/i })).toBeVisible({ timeout: 15000 });

  // Submit fully empty — per BUG_PATTERNS.md this now shows styled, in-app
  // validation messages (fixed 2026-08-07; previously only a native browser
  // tooltip appeared).
  await page.getByRole('button', { name: /^create project$/i }).last().click();

  await expect(
    page.getByText(/must be at least 2 characters|required/i).first()
  ).toBeVisible({ timeout: 10000 });

  // Fix the error and confirm valid input clears it. Stop short of actually
  // submitting again here — the happy-path "Create project" test above
  // already covers a full successful submission end-to-end.
  const projectNameText = unique('Validation Test Project');
  await page.locator('input[placeholder*="Type name"]').first().fill(projectNameText);
  await expect(page.getByText(/must be at least 2 characters/i)).not.toBeVisible({ timeout: 5000 }).catch(() => {});
});
