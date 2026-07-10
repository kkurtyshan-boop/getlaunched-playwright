import { test, expect } from '@playwright/test';
import { login, PROJECT_NAME } from './helpers';

async function openResourcesTab(page) {
  await page.goto('/', {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const projectCard = page.getByText(PROJECT_NAME, { exact: true }).first();
  await expect(projectCard).toBeVisible({ timeout: 15000 });
  await projectCard.scrollIntoViewIfNeeded();
  await projectCard.click();

  const operationsLink = page.getByRole('link', { name: /^operations$/i }).first();
  await expect(operationsLink).toBeVisible({ timeout: 15000 });
  await operationsLink.click();

  await expect(
    page.getByRole('heading', { name: /^operations$/i }).first()
  ).toBeVisible({ timeout: 15000 });

  const resourcesTab = page.getByRole('tab', { name: /^resources$/i }).first();
  await expect(resourcesTab).toBeVisible({ timeout: 15000 });
  await resourcesTab.click();
}

// The list-level filter toggle — "Investments" (plural) / "Running costs"
async function switchResourceListTab(page, tabLabel) {
  const radio = page.getByRole('radio', { name: tabLabel, exact: true }).first();
  await expect(radio).toBeVisible({ timeout: 15000 });
  await radio.click();
}

async function openEditModalForRow(page, rowText) {
  const row = page.locator('tr').filter({ hasText: rowText }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.scrollIntoViewIfNeeded();

  const menuButton = row.getByRole('button', { name: /open actions menu/i }).first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel) {
  const dropdownButton = scope
    .locator('button[data-open="false"]')
    .nth(dropdownIndex);

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox
    .getByRole('option', { name: optionLabel, exact: true })
    .first();

  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
}

// Only touches the fields present in `changes`, leaving the rest of the
// pre-filled edit form untouched. Dropdown positions: Category(0), Payment type(1), Start year(2).
async function applyInvestmentEdits(page, modal, changes) {
  if (changes.name) {
    const field = modal.getByPlaceholder('Type resource name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.name);
  }

  if (changes.category) {
    await selectFromCustomDropdown(page, modal, 0, changes.category);
    await page.waitForTimeout(200);
  }

  if (changes.cost) {
    const field = modal.getByPlaceholder(/type cost/i).first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.cost);
  }

  if (changes.amortizationPeriod) {
    const field = modal.getByPlaceholder(/type amortization period/i).first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.amortizationPeriod);
  }

  if (changes.startYear) {
    await selectFromCustomDropdown(page, modal, 2, changes.startYear);
    await page.waitForTimeout(200);
  }

  if (changes.description) {
    const field = modal.getByPlaceholder('Write your story...').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.description);
  }
}

async function applyRunningCostEdits(page, modal, changes) {
  if (changes.name) {
    const field = modal.getByPlaceholder('Type resource name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.name);
  }

  if (changes.category) {
    await selectFromCustomDropdown(page, modal, 0, changes.category);
    await page.waitForTimeout(200);
  }

  if (changes.paymentType) {
    await selectFromCustomDropdown(page, modal, 1, changes.paymentType);
    await page.waitForTimeout(200);
  }

  if (changes.costsPerYear) {
    const costInputs = modal.getByPlaceholder(/type cost/i);
    const costCount = await costInputs.count();
    for (let i = 0; i < costCount; i++) {
      if (changes.costsPerYear[i] !== undefined) {
        await costInputs.nth(i).fill(changes.costsPerYear[i]);
      }
    }
  }

  if (changes.startYear) {
    await selectFromCustomDropdown(page, modal, 2, changes.startYear);
    await page.waitForTimeout(200);
  }

  if (changes.description) {
    const field = modal.getByPlaceholder('Write your story...').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.description);
  }
}

async function updateResource(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();

  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
}

test.describe.serial('Edit resources flow', () => {
  test('01. Edit investment resource cost and amortization period', async ({ page }) => {
    await login(page);
    await openResourcesTab(page);

    const modal = await openEditModalForRow(page, 'Парфумерне виробниче обладнання');

    await applyInvestmentEdits(page, modal, {
      cost: '275000',
      amortizationPeriod: '72',
    });

    await updateResource(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });

  test('02. Edit running costs resource cost per year and payment type', async ({ page }) => {
    await login(page);
    await openResourcesTab(page);
    await switchResourceListTab(page, 'Running costs');

    const modal = await openEditModalForRow(page, 'Сировина для парфумів');

    await applyRunningCostEdits(page, modal, {
      costsPerYear: ['420000', '460000'],
      paymentType: 'Annually',
    });

    await updateResource(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });
});
