import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { RESOURCE_NAME, unique } from './config';
import {
  createResource,
  openResourcesTab,
  openCreateResourceModal,
  switchResourceListTab,
  selectFromCustomDropdown,
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
// Form shapes (confirmed live 2026-11-11): Investment = Category, Year,
// Useful life (years), Investment amount; Running costs = Category,
// Payment type, Start year, Cost per year (one input per planning-horizon
// year). The "cost year before Start year is rejected" rule (BUG_PATTERNS.md)
// applies to Running costs and is covered by test 03 below.
const INVESTMENT_FIXTURES = [
  { label: 'Equipment', category: 'Equipment', startYearIndex: 0, investmentAmount: '25000', usefulLife: '5' },
  { label: 'Office space', category: 'Office space', startYearIndex: 0, investmentAmount: '120000', usefulLife: '20' },
  { label: 'Trade secrets', category: 'Trade secrets', startYearIndex: 1, investmentAmount: '8000', usefulLife: '3' },
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
        investmentAmount: fixture.investmentAmount,
        usefulLife: fixture.usefulLife,
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

  test('03. Running cost blocks cost input for years before the start year', async ({ page, project }) => {
    // Boundary coverage for BUG_PATTERNS.md "Resources — Running Cost
    // Rejected for Years Before Start Year". Since 2026-11 the app prevents
    // the invalid input up front: every "Cost per year" column earlier than
    // the selected Start year is disabled (the old behavior was a rejection
    // toast on submit).
    test.setTimeout(60_000);

    await login(page);

    await openResourcesTab(page, project);
    await switchResourceListTab(page, 'Running costs');
    const modal = await openCreateResourceModal(page);

    await modal.getByPlaceholder('Type resource name').first().fill(unique(`${RESOURCE_NAME} Cost Before Start`));
    await selectFromCustomDropdown(page, modal, 0, 'Goods and Materials');
    await selectFromCustomDropdown(page, modal, 1, 'Monthly');

    // Start year = the SECOND option, so the first planning-horizon column
    // is earlier than the resource's start.
    const startYearButton = modal.locator('button[data-open="false"]').nth(2);
    await startYearButton.click();
    const startYearListbox = page.getByRole('listbox').last();
    await expect(startYearListbox).toBeVisible({ timeout: 15000 });
    await startYearListbox.getByRole('option').nth(1).click();
    await expect(startYearListbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});

    const costInputs = modal.getByPlaceholder(/type cost/i);
    await expect(costInputs.nth(0)).toBeDisabled({ timeout: 10000 });
    await expect(costInputs.nth(1)).toBeEnabled({ timeout: 10000 });

    // Nothing is saved — close without creating.
    await modal.getByRole('button', { name: /cancel/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });
});
