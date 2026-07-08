import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const CLIENT_MAKEUP = 'Makeup-ентузіасти Dior (20-45) _test';

const UPDATED_INSTAGRAM_NAME = 'Dior Instagram Campaign — Reels Push';
const UPDATED_EVENT_STRATEGY =
  'Оновлена стратегія: pop-up тур трьома містами з ексклюзивною подарунковою колекцією Dior.';

async function login(page) {
  await page.goto('https://frontv2.getlaunched.io/sign-in', {
    waitUntil: 'domcontentloaded',
  });

  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();
  const signInButton = page.getByRole('button', { name: /sign in/i }).first();

  await expect(email).toBeVisible({ timeout: 15000 });
  await email.fill('kataratest573@gmail.com');

  await expect(password).toBeVisible({ timeout: 15000 });
  await password.fill('Test_11K');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
    signInButton.click(),
  ]);

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page).not.toHaveURL(/\/sign-in/i);
}

async function openOperationsPage(page) {
  await page.goto('https://frontv2.getlaunched.io/', {
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
}

async function openEditModalForChannel(page, channelName) {
  const row = page.locator('tr').filter({ hasText: channelName }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.scrollIntoViewIfNeeded();

  const actionButton = row.locator('button').last();
  await expect(actionButton).toBeVisible({ timeout: 15000 });
  await actionButton.click();

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
// pre-filled edit form untouched.
async function applyChannelStepEdits(page, modal, changes) {
  if (changes.name) {
    const nameField = modal.getByPlaceholder('Type channel name').first();
    await expect(nameField).toBeVisible({ timeout: 15000 });
    await nameField.fill(changes.name);
  }

  if (changes.category) {
    await selectFromCustomDropdown(page, modal, 0, changes.category);
    await page.waitForTimeout(200);

    const customCategoryField = modal.getByPlaceholder(/type category name/i).first();
    if (changes.customCategoryName && (await customCategoryField.count())) {
      await customCategoryField.fill(changes.customCategoryName);
    }
  }

  if (changes.client) {
    await selectFromCustomDropdown(page, modal, 1, changes.client);
    await page.waitForTimeout(200);
  }

  if (changes.strategy) {
    const strategyField = modal.getByPlaceholder('Write your story...').first();
    await expect(strategyField).toBeVisible({ timeout: 15000 });
    await strategyField.fill(changes.strategy);
  }
}

async function goToSalesFunnelsStep(modal) {
  const nextButton = modal.getByRole('button', { name: /^next$/i }).first();

  await expect(nextButton).toBeVisible({ timeout: 15000 });
  await nextButton.click();

  await expect(modal.getByPlaceholder(/type budget/i).first()).toBeVisible({
    timeout: 15000,
  });
}

async function applySalesFunnelsEdits(modal, changes) {
  if (changes.monthlyBudget) {
    const budgetField = modal.getByPlaceholder(/type budget/i).first();
    await expect(budgetField).toBeVisible({ timeout: 15000 });
    await budgetField.fill(changes.monthlyBudget);
  }

  if (changes.reach) {
    const reachField = modal.getByPlaceholder(/type reach/i).first();
    await expect(reachField).toBeVisible({ timeout: 15000 });
    await reachField.fill(changes.reach);
  }

  if (changes.conversionToLead) {
    const leadField = modal.getByPlaceholder(/type lead/i).first();
    await expect(leadField).toBeVisible({ timeout: 15000 });
    await leadField.fill(changes.conversionToLead);
  }

  if (changes.conversionToCustomer) {
    const conversionField = modal.getByPlaceholder(/type conversion/i).first();
    await expect(conversionField).toBeVisible({ timeout: 15000 });
    await conversionField.fill(changes.conversionToCustomer);
  }
}

async function updateChannel(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();

  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
}

test.describe.serial('Edit marketing channels flow', () => {
  test('01. Edit channel name and monthly budget', async ({ page }) => {
    await login(page);
    await openOperationsPage(page);

    const modal = await openEditModalForChannel(page, 'Dior Instagram Campaign');

    await applyChannelStepEdits(page, modal, { name: UPDATED_INSTAGRAM_NAME });
    await goToSalesFunnelsStep(modal);
    await applySalesFunnelsEdits(modal, { monthlyBudget: '52000' });

    await updateChannel(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(UPDATED_INSTAGRAM_NAME, {
      timeout: 15000,
    });
  });

  test('02. Edit channel client connection and conversion to lead', async ({ page }) => {
    await login(page);
    await openOperationsPage(page);

    const modal = await openEditModalForChannel(
      page,
      'Dior Google Ads — Parfum Search'
    );

    await applyChannelStepEdits(page, modal, { client: CLIENT_MAKEUP });
    await goToSalesFunnelsStep(modal);
    await applySalesFunnelsEdits(modal, { conversionToLead: '9' });

    await updateChannel(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });

  test('03. Edit channel strategy description and estimated reach', async ({ page }) => {
    await login(page);
    await openOperationsPage(page);

    const modal = await openEditModalForChannel(page, 'Dior Pop-up Event Paris');

    await applyChannelStepEdits(page, modal, { strategy: UPDATED_EVENT_STRATEGY });
    await goToSalesFunnelsStep(modal);
    await applySalesFunnelsEdits(modal, { reach: '20000' });

    await updateChannel(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });
});
