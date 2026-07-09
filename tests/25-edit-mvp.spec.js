import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const UPDATED_STYLING_MVP_NAME = 'Boutique Personal Styling Pilot — Phase 2';
const UPDATED_STYLING_FEATURE_DESCRIPTION =
  'Appointment booking system for personal styling sessions, now including virtual consultations.';
const UPDATED_PREORDER_HYPOTHESIS_THEN =
  'a meaningful share of loyal customers will commit to a purchase in advance, with at least half opting for the higher-tier bundle';

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

async function openMvpTab(page) {
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

  const implementationTab = page.getByRole('tab', { name: /^implementation$/i }).first();
  if (await implementationTab.isVisible().catch(() => false)) {
    await implementationTab.click();
  } else {
    const implementationLink = page.getByRole('link', { name: /^implementation$/i }).first();
    await expect(implementationLink).toBeVisible({ timeout: 15000 });
    await implementationLink.click();
  }

  await expect(
    page.getByRole('heading', { name: /implementation/i }).first()
  ).toBeVisible({ timeout: 15000 });

  const mvpTab = page.getByRole('tab', { name: /^mvp$/i }).first();
  await expect(mvpTab).toBeVisible({ timeout: 15000 });
  await mvpTab.click();
  await page.waitForTimeout(500);
}

async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel, exact = true) {
  const dropdownButton = scope.locator('button[data-open="false"]').nth(dropdownIndex);

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: optionLabel, exact }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
}

async function openEditMvpForm(page, mvpName) {
  const heading = page.getByRole('heading', { name: mvpName, exact: true }).first();
  await expect(heading).toBeVisible({ timeout: 15000 });

  const cardContainer = heading.locator('xpath=ancestor::*[1]');
  const menuButton = cardContainer.getByRole('button', { name: /open actions menu/i }).first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.getByPlaceholder('Type MVP Name...').first()).toBeVisible({
    timeout: 15000,
  });
}

// Only touches the fields present in `changes`, leaving the rest of the
// pre-filled edit form untouched. Dropdown positions: Type(0), Target segment(1).
async function applyMvpEdits(page, changes) {
  if (changes.name) {
    const field = page.getByPlaceholder('Type MVP Name...').first();
    await field.fill(changes.name);
  }

  if (changes.type) {
    await selectFromCustomDropdown(page, page, 0, changes.type);
  }

  if (changes.segment) {
    await selectFromCustomDropdown(page, page, 1, changes.segment, false);
  }

  if (changes.hypothesisIf) {
    await page.getByPlaceholder('If we build/test...').first().fill(changes.hypothesisIf);
  }

  if (changes.hypothesisThen) {
    await page.getByPlaceholder('Then users will...').first().fill(changes.hypothesisThen);
  }

  if (changes.hypothesisBecause) {
    await page.getByPlaceholder('Because we believe...').first().fill(changes.hypothesisBecause);
  }

  if (changes.featureDescription) {
    await page.getByPlaceholder('Write your story...').first().fill(changes.featureDescription);
  }

  if (changes.successMetric) {
    await page.getByPlaceholder('e.g. Conversation rate').first().fill(changes.successMetric);
  }

  if (changes.targetValue) {
    await page.getByRole('textbox', { name: 'Target value' }).first().fill(changes.targetValue);
  }

  if (changes.timeFrame) {
    await page.getByRole('textbox', { name: 'Time frame' }).first().fill(changes.timeFrame);
  }
}

async function submitMvpUpdate(page, expectedName) {
  const updateButton = page.getByRole('button', { name: /^update mvp$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: expectedName, exact: true }).first()
  ).toBeVisible({ timeout: 15000 });
}

test.describe.serial('Edit MVP flow', () => {
  test('01. Edit MVP target segment and target value', async ({ page }) => {
    await login(page);
    await openMvpTab(page);

    await openEditMvpForm(page, 'AR Virtual Try-On Prototype');

    await applyMvpEdits(page, {
      segment: 'Преміум-колекціонери ароматів (15-35) _test',
      targetValue: '> 20%',
    });

    await submitMvpUpdate(page, 'AR Virtual Try-On Prototype');
  });

  test('02. Edit MVP hypothesis and time frame', async ({ page }) => {
    await login(page);
    await openMvpTab(page);

    await openEditMvpForm(page, 'Limited Edition Fragrance Pre-Order');

    await applyMvpEdits(page, {
      hypothesisThen: UPDATED_PREORDER_HYPOTHESIS_THEN,
      timeFrame: '21 days',
    });

    await submitMvpUpdate(page, 'Limited Edition Fragrance Pre-Order');
  });

  test('03. Edit MVP name and feature description', async ({ page }) => {
    await login(page);
    await openMvpTab(page);

    await openEditMvpForm(page, 'Boutique Personal Styling Pilot');

    await applyMvpEdits(page, {
      name: UPDATED_STYLING_MVP_NAME,
      featureDescription: UPDATED_STYLING_FEATURE_DESCRIPTION,
    });

    await submitMvpUpdate(page, UPDATED_STYLING_MVP_NAME);
  });
});
