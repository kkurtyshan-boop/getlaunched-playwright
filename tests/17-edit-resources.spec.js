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
  investmentAmountField,
  usefulLifeField,
} from './helpers/resource.helper';

// Self-contained: creates its own Investment and Running-cost resources
// instead of depending on 16-create-resources.spec.js having run first —
// same test.describe.serial + `let` pattern as
// tests/07-edit-product-add-delete-client.spec.js.
//
// Investment edit covers Category + Useful life + Investment amount; Running
// costs edit covers Payment type + Cost per year (form shapes confirmed live
// 2026-11-11 — see helpers/resource.helper.js fillResourceForm).
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

  test('01. Edit investment resource category, useful life and amount', async ({ page, project }) => {
    await login(page);
    await openResourcesTab(page, project);
    await switchResourceListTab(page, 'Investments');

    const modal = await openEditModalForResource(page, investmentResource.name);
    const updatedCategory = 'Office space';

    await applyResourceEdits(page, modal, {
      category: updatedCategory,
      usefulLife: '8',
      investmentAmount: '45000',
    });

    await updateResourceForm(modal);

    // Verify persistence: reopen the edit modal and confirm the new values
    // stuck, rather than trusting a body-text toast (lesson: body-scoped
    // "success" text can false-positive — see CLAUDE.md).
    await switchResourceListTab(page, 'Investments');
    const verifyModal = await openEditModalForResource(page, investmentResource.name);

    const categoryButton = verifyModal.locator('button[data-open="false"]').nth(0);
    await expect(categoryButton).toContainText(updatedCategory);
    await expect(usefulLifeField(verifyModal)).toHaveValue('8');
    // Amount inputs re-format their value with thousands separators (e.g.
    // "45 000"), so compare with separators stripped.
    expect((await investmentAmountField(verifyModal).inputValue()).replace(/[\s',]/g, '')).toBe('45000');
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
      expect(raw.replace(/[\s',]/g, '')).toBe(updatedCostsPerYear[i]);
    }

    const paymentTypeButton = verifyModal.locator('button[data-open="false"]').nth(1);
    await expect(paymentTypeButton).toContainText(updatedPaymentType);
  });
});
