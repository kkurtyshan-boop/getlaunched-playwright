import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { RESOURCE_NAME, unique } from './config';
import {
  createResource,
  openResourcesTab,
  switchResourceListTab,
  openEditModalForResource,
  applyResourceEdits,
  updateResourceForm,
} from './helpers/resource.helper';

// Self-contained: creates its own Investment and Running-cost resources
// instead of depending on 16-create-resources.spec.js having run first —
// same test.describe.serial + `let` pattern as
// tests/07-edit-product-add-delete-client.spec.js.
//
// Confirmed live 2026-08-24 by inspecting the Edit Resource modal directly:
// Investment resources no longer have a single "Cost" field or an
// "Amortization period" field — both Investment and Running costs share
// the same "Cost per year" shape (one input per planning-horizon year), so
// both edit tests below exercise Category + Cost-per-year (Investment) /
// Payment type + Cost-per-year (Running costs) rather than the pre-change
// Cost/Amortization fields the original file edited.
test.describe.serial('Edit resources flow', () => {
  let investmentResource;
  let runningCostResource;

  test('00. Set up an investment and a running cost resource', async ({ page, project }) => {
    test.setTimeout(90_000);

    await login(page);

    investmentResource = await createResource(page, project, {
      type: 'investment',
      name: unique(`${RESOURCE_NAME} Edit Investment`),
    });

    runningCostResource = await createResource(page, project, {
      type: 'running',
      name: unique(`${RESOURCE_NAME} Edit Running`),
    });
  });

  test('01. Edit investment resource category and cost per year', async ({ page, project }) => {
    await login(page);
    await openResourcesTab(page, project);
    await switchResourceListTab(page, 'Investments');

    const modal = await openEditModalForResource(page, investmentResource.name);

    const costCount = await modal.getByPlaceholder(/type cost/i).count();
    const updatedCostsPerYear = Array.from({ length: costCount }, (_, i) => String(15000 + i * 1000));
    const updatedCategory = 'Office space';

    await applyResourceEdits(page, modal, {
      category: updatedCategory,
      costsPerYear: updatedCostsPerYear,
    });

    await updateResourceForm(modal);

    // Verify persistence: reopen the edit modal and confirm the new values
    // stuck, rather than trusting a body-text toast (lesson: body-scoped
    // "success" text can false-positive — see CLAUDE.md).
    await switchResourceListTab(page, 'Investments');
    const verifyModal = await openEditModalForResource(page, investmentResource.name);

    const categoryButton = verifyModal.locator('button[data-open="false"]').nth(0);
    await expect(categoryButton).toContainText(updatedCategory);

    // Cost inputs re-format their value with thousands separators (e.g.
    // "15 000"), so compare with whitespace stripped rather than exact text.
    const costInputs = verifyModal.getByPlaceholder(/type cost/i);
    for (let i = 0; i < updatedCostsPerYear.length; i++) {
      const raw = await costInputs.nth(i).inputValue();
      expect(raw.replace(/\s/g, '')).toBe(updatedCostsPerYear[i]);
    }
  });

  test('02. Edit running costs resource payment type and cost per year', async ({ page, project }) => {
    await login(page);
    await openResourcesTab(page, project);
    await switchResourceListTab(page, 'Running costs');

    const modal = await openEditModalForResource(page, runningCostResource.name);

    const costCount = await modal.getByPlaceholder(/type cost/i).count();
    const updatedCostsPerYear = Array.from({ length: costCount }, (_, i) => String(21000 + i * 1000));
    const updatedPaymentType = 'Annually';

    await applyResourceEdits(page, modal, {
      paymentType: updatedPaymentType,
      costsPerYear: updatedCostsPerYear,
    });

    await updateResourceForm(modal);

    // Verify persistence: reopen the edit modal and confirm the new values
    // stuck (cost-per-year inputs + the Payment type dropdown's selection).
    await switchResourceListTab(page, 'Running costs');
    const verifyModal = await openEditModalForResource(page, runningCostResource.name);

    const costInputs = verifyModal.getByPlaceholder(/type cost/i);
    for (let i = 0; i < updatedCostsPerYear.length; i++) {
      const raw = await costInputs.nth(i).inputValue();
      expect(raw.replace(/\s/g, '')).toBe(updatedCostsPerYear[i]);
    }

    const paymentTypeButton = verifyModal.locator('button[data-open="false"]').nth(1);
    await expect(paymentTypeButton).toContainText(updatedPaymentType);
  });
});
