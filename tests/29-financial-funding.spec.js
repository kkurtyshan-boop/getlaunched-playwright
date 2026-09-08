import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { gotoFinancial } from './helpers/navigation';

// Financial — Funding & Setup had zero spec coverage before this file.

async function openFundingSetup(page, project) {
  await gotoFinancial(page, project, 'funding-setup');

  await expect(page).toHaveURL(/\/financial\/funding-setup/i, { timeout: 15000 });
}

test.describe('Financial — Funding & Setup', () => {
  test('01. Working capital calculator computes the cash conversion cycle live', async ({ page, project }) => {
    await login(page);
    await openFundingSetup(page, project);

    const dioField = page.getByLabel(/days inventory outstanding/i).or(page.getByPlaceholder(/dio/i)).first();
    const dsoField = page.getByLabel(/days sales outstanding/i).or(page.getByPlaceholder(/dso/i)).first();
    const dpoField = page.getByLabel(/days payables outstanding/i).or(page.getByPlaceholder(/dpo/i)).first();

    await expect(dioField).toBeVisible({ timeout: 15000 });
    await dioField.fill('30');
    await dsoField.fill('20');
    await dpoField.fill('10');

    // DIO + DSO - DPO = 40 — a "Moderate" band (30-60 days).
    await expect(page.getByText(/cash conversion cycle/i).first()).toBeVisible();
    await expect(page.getByText(/40\s*days/i).first()).toBeVisible({ timeout: 10000 });

    const saveButton = page.getByRole('button', { name: /save changes/i }).first();
    await expect(saveButton).toBeVisible();
  });

  // Below Working Capital, a second section (also headed "Funding & Setup" on
  // this page, subtitled "Track equity and debt transactions") shows Total
  // equity / Debt outstanding / Interest cost / Net funding tiles and a
  // financing-activity list.
  test('02. Funding & Capital section renders (empty state or activity list)', async ({ page, project }) => {
    await login(page);
    await openFundingSetup(page, project);

    await expect(page.getByText(/track equity and debt transactions/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/total equity/i)).toBeVisible();
    await expect(page.getByText(/debt outstanding/i)).toBeVisible();
    await expect(page.getByText(/net funding/i)).toBeVisible();

    const createActivityButton = page.getByRole('button', { name: /create activity/i }).first();
    await expect(createActivityButton).toBeVisible({ timeout: 15000 });

    // Either the documented empty state is showing, or at least one
    // financing activity already exists — both are valid, but the section
    // must render one of them, not neither.
    // Each financing activity renders as a card (title + category badge +
    // an "Amount" figure) rather than a table row, so use the card's heading
    // as the row-equivalent signal.
    const hasEmptyState = await page.getByText(/no financing activities yet/i).isVisible().catch(() => false);
    const activityCardCount = await page.getByRole('heading', { level: 3 }).count().catch(() => 0);
    expect(hasEmptyState || activityCardCount > 0).toBe(true);
  });
});
