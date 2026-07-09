import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const UPDATED_PATENT_NOTES =
  'Патент на технологію стійкої формули аромату успішно отримано, охорона дії — 20 років.';

const UPDATED_LOCATION_NAME = 'Paris Flagship District — Expanded';
const UPDATED_LOCATION_ADDRESS = '30 Avenue Montaigne, 2nd Floor, Paris, France';

const UPDATED_SUPPLIER_EMAIL = 'partnerships@grasseessence.fr';
const UPDATED_SUPPLIER_COUNTRY = 'France (EU)';

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

async function openOtherTab(page) {
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

  const otherTab = page.getByRole('tab', { name: /^other$/i }).first();
  await expect(otherTab).toBeVisible({ timeout: 15000 });
  await otherTab.click();
}

async function expandAccordionSection(page, sectionName) {
  const region = page.getByRole('region', { name: new RegExp(sectionName, 'i') }).first();

  if (!(await region.isVisible().catch(() => false))) {
    const header = page.getByRole('button', { name: new RegExp(sectionName, 'i') }).first();
    await expect(header).toBeVisible({ timeout: 15000 });
    await header.click();
    await page.waitForTimeout(300);
  }

  await expect(region).toBeVisible({ timeout: 15000 });
  return region;
}

async function selectFromCustomDropdown(page, scope, optionLabel) {
  const dropdownButton = scope.locator('button[data-open="false"]').first();

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

async function openCardEditModal(page, region, cardText) {
  const card = region.locator('li').filter({ hasText: cardText }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.scrollIntoViewIfNeeded();

  const menuButton = card.getByRole('button', { name: /open actions menu/i }).first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

async function updateModal(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();

  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
}

test.describe.serial('Edit other (Operations) flow', () => {
  test('01. Edit patent registration status and notes', async ({ page }) => {
    await login(page);
    await openOtherTab(page);

    // The IP Rights nav buttons carry a status badge (e.g. "Patent Planned"),
    // so match by prefix rather than the exact label.
    const patentButton = page.getByRole('button', { name: /^Patent\b/ }).first();
    await expect(patentButton).toBeVisible({ timeout: 15000 });
    await patentButton.click();
    await page.waitForTimeout(300);

    await selectFromCustomDropdown(page, page, 'Registered');

    const notesField = page.getByPlaceholder('Type text').first();
    await expect(notesField).toBeVisible({ timeout: 15000 });
    await notesField.fill(UPDATED_PATENT_NOTES);

    const saveButton = page.getByRole('button', { name: /^save$/i }).first();
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await saveButton.click();
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const registrationStatusButton = page
      .locator('button[data-open="false"]')
      .first();
    await expect(registrationStatusButton).toContainText('Registered', {
      timeout: 15000,
    });
  });

  test('02. Edit a location and a location criterion weight', async ({ page }) => {
    await login(page);
    await openOtherTab(page);

    const region = await expandAccordionSection(page, 'Location Analysis');

    const locationModal = await openCardEditModal(page, region, 'Paris Flagship District');
    await locationModal.getByPlaceholder('Type name').fill(UPDATED_LOCATION_NAME);
    await locationModal.getByPlaceholder('Type address').fill(UPDATED_LOCATION_ADDRESS);
    await updateModal(locationModal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(UPDATED_LOCATION_NAME, {
      timeout: 15000,
    });

    const criterionModal = await openCardEditModal(page, region, 'Rent affordability');
    await criterionModal.getByRole('radio', { name: '8', exact: true }).click();
    await updateModal(criterionModal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });

  test('03. Edit a supplier and a supplier criterion weight', async ({ page }) => {
    await login(page);
    await openOtherTab(page);

    const region = await expandAccordionSection(page, 'Supplier Analysis');

    const supplierModal = await openCardEditModal(page, region, 'Grasse Essence Co.');
    await supplierModal.getByPlaceholder('Type email').fill(UPDATED_SUPPLIER_EMAIL);
    await supplierModal.getByPlaceholder('Type country').fill(UPDATED_SUPPLIER_COUNTRY);
    await updateModal(supplierModal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });

    const criterionModal = await openCardEditModal(page, region, 'Cost competitiveness');
    await criterionModal.getByRole('radio', { name: '8', exact: true }).click();
    await updateModal(criterionModal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });
});
