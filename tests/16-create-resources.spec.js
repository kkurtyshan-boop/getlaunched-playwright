import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { RESOURCE_NAME, unique } from './config';
import {
  createResource,
  openResourcesTab,
  openCreateResourceModal,
  switchToRunningCostsInModal,
  selectFromCustomDropdown,
  clickCreateButton,
  getResourceRow,
} from './helpers/resource.helper';

// Generic fixture data (no "Dior Brand" business narrative) — a handful of
// categories per type, enough to exercise the shape of each form without
// the ~19-record sweep the original file did (7 Investment + 12 Running
// costs categories). `label` is static (used in the test title); the
// actual unique() name is generated at test-run time inside the test body
// — see CLAUDE.md lesson: a title built from unique()/Date.now() at module
// load breaks worker/list-pass sync ("Test not found in the worker
// process").
//
// Confirmed live 2026-08-24 by inspecting the Create/Edit Resource modal
// directly: Investment resources no longer have a single "Cost" field or
// an "Amortization period" field — both Investment and Running costs now
// share the exact same "Cost per year" (one input per planning-horizon
// year) shape, differing only in the Payment type dropdown (fixed
// "One-time payment" for Investment vs. selectable Monthly/Annually for
// Running costs). This makes PROJECT_KNOWLEDGE.md §3.3's Investment field
// list and BUG_PATTERNS.md's "Resources — Amortization Period Capped at
// 100" stale — there's no Amortization field left to apply that cap to,
// so no boundary test for it is included below (it would be testing a
// field that doesn't exist). The "cost year before Start year is
// rejected" rule (also in BUG_PATTERNS.md) is still very much alive and is
// covered by test 03 below, now confirmed to apply to both resource types.
const INVESTMENT_FIXTURES = [
  { label: 'Equipment', category: 'Equipment', startYearIndex: 0 },
  { label: 'Office space', category: 'Office space', startYearIndex: 0 },
  { label: 'Trade secrets', category: 'Trade secrets', startYearIndex: 1 },
];

const RUNNING_COST_FIXTURES = [
  { label: 'Goods and Materials', category: 'Goods and Materials', paymentType: 'Monthly', startYearIndex: 0 },
  { label: 'Rent and Utilities', category: 'Rent and Utilities', paymentType: 'Monthly', startYearIndex: 0 },
  // startYearIndex 1 → the earliest planning year is before this
  // resource's Start year and gets defensively skipped by the helper
  // (fillResourceCostPerYear), exercising the same skip logic live.
  { label: 'Research and Development', category: 'Research and Development', paymentType: 'Annually', startYearIndex: 1 },
];

test.describe.serial('Create resources flow', () => {
  test('01. Create investment resources across categories', async ({ page, project }) => {
    // 3 resources created sequentially — well beyond the default 30s timeout.
    test.setTimeout(150_000);

    await login(page);

    for (const fixture of INVESTMENT_FIXTURES) {
      const resource = await createResource(page, project, {
        type: 'investment',
        name: unique(`${RESOURCE_NAME} ${fixture.label}`),
        category: fixture.category,
        startYearIndex: fixture.startYearIndex,
      });

      const row = await getResourceRow(page, resource.name);
      await expect(row).toContainText(resource.category);
    }
  });

  test('02. Create running costs resources across categories', async ({ page, project }) => {
    // 3 resources created sequentially — well beyond the default 30s timeout.
    test.setTimeout(150_000);

    await login(page);

    for (const fixture of RUNNING_COST_FIXTURES) {
      const resource = await createResource(page, project, {
        type: 'running',
        name: unique(`${RESOURCE_NAME} ${fixture.label}`),
        category: fixture.category,
        paymentType: fixture.paymentType,
        startYearIndex: fixture.startYearIndex,
      });

      const row = await getResourceRow(page, resource.name);
      await expect(row).toContainText(resource.category);
    }
  });

  test('03. Running cost rejects a cost value for a year before the start year', async ({ page, project }) => {
    // Boundary coverage for BUG_PATTERNS.md "Resources — Running Cost
    // Rejected for Years Before Start Year" (previously an explicit gap
    // per RELEASE_CHECKLIST.md §10 Edge Cases). Deliberately selects the
    // second available Start year option, then fills the *first*
    // planning-horizon year's Cost column — a year before the resource's
    // own Start year. Confirmed live: this is rejected with a toast
    // ("Yearly cost years must not be earlier than the resource start
    // year.") and the modal stays open / no record is created.
    test.setTimeout(60_000);

    await login(page);

    const rejectedName = unique(`${RESOURCE_NAME} Cost Before Start`);
    await openResourcesTab(page, project);
    const modal = await openCreateResourceModal(page);
    await switchToRunningCostsInModal(page, modal);

    const nameField = modal.getByPlaceholder('Type resource name').first();
    await expect(nameField).toBeVisible({ timeout: 15000 });
    await nameField.fill(rejectedName);

    // Category and Payment type are also required — fill them so the only
    // validation error triggered by submitting is the cost-per-year one
    // under test.
    await selectFromCustomDropdown(page, modal, 0, 'Goods and Materials');
    await selectFromCustomDropdown(page, modal, 1, 'Monthly');

    // Force-fill the first cost column directly (bypassing the helper's
    // own defensive skip) while Start year is the *second* available
    // option, so column 0 is guaranteed to be earlier than Start year.
    const startYearButton = modal.locator('button[data-open="false"]').nth(2);
    await startYearButton.click();
    const startYearListbox = page.getByRole('listbox').last();
    await expect(startYearListbox).toBeVisible({ timeout: 15000 });
    await startYearListbox.getByRole('option').nth(1).click();
    await expect(startYearListbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});

    const costInputs = modal.getByPlaceholder(/type cost/i);
    await costInputs.nth(0).fill('5000');

    await clickCreateButton(modal);

    await expect(page.getByText(/yearly cost years must not be earlier than the resource start year/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(modal).toBeVisible();
    await expect(page.getByText(rejectedName)).toHaveCount(0);

    await modal.getByRole('button', { name: /cancel/i }).click();
  });
});
