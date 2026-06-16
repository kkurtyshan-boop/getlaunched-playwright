import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const PRODUCT_WITH_CLIENT = 'Eau de Parfum Dior — Signature';
const PRODUCT_WITHOUT_CLIENT = "Parfum Intense Dior — L'Imperiale";
const CLIENT_NAME = 'Преміум-колекціонери ароматів (15-35) _test';

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page).not.toHaveURL(/\/sign-in/i);
}

async function openProductsServicesPage(page) {
  await page.goto('https://frontv2.getlaunched.io/', {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForLoadState('networkidle').catch(() => {});

  const projectCard = page.getByText(PROJECT_NAME, { exact: true }).first();
  await expect(projectCard).toBeVisible({ timeout: 15000 });
  await projectCard.scrollIntoViewIfNeeded();
  await projectCard.click();

  const magicTriangle = page.getByText(/magic triangle/i).first();
  await expect(magicTriangle).toBeVisible({ timeout: 15000 });
  await magicTriangle.click();

  await expect(page).toHaveURL(/\/triangle/i, { timeout: 15000 });

  const productsServicesButton = page
    .getByText(/products\s*\/\s*services/i)
    .first();

  await expect(productsServicesButton).toBeVisible({ timeout: 15000 });
  await productsServicesButton.click();

  await expect(page.locator('body')).toContainText(/Products \/ Services/i, {
    timeout: 15000,
  });
}

async function openProductDetails(page, productName) {
  const productCard = page
    .getByText(productName, { exact: false })
    .first();

  await expect(productCard).toBeVisible({ timeout: 15000 });
  await productCard.scrollIntoViewIfNeeded();
  await productCard.click();
}

async function openEditModal(page) {
  const editButton = page.getByRole('button', {
    name: /^edit$/i,
  }).first();

  await expect(editButton).toBeVisible({ timeout: 15000 });
  await editButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

async function deleteClientFromProduct(page, modal) {
  const deleteClientButton = modal
    .locator('button:has(svg path[d*="M21 5.98047"])')
    .first();

  await expect(deleteClientButton).toBeVisible({ timeout: 15000 });
  await deleteClientButton.click();

  const confirmDeleteButton = page.getByRole('button', {
    name: /yes, delete this client/i,
  });

  await expect(confirmDeleteButton).toBeVisible({ timeout: 15000 });
  await confirmDeleteButton.click();
}

async function addClientToProduct(page, modal) {
  const addClientButton = modal.getByRole('button', {
    name: /^add client$/i,
  }).first();

  await expect(addClientButton).toBeVisible({ timeout: 15000 });
  await addClientButton.click();

  const clientDropdown = modal
    .getByRole('button', { name: /^select$/i })
    .last();

  await expect(clientDropdown).toBeVisible({ timeout: 15000 });
  await clientDropdown.click();

  const clientOption = page
    .locator('[role="option"]')
    .filter({ hasText: new RegExp(escapeRegExp(CLIENT_NAME), 'i') })
    .first();

  await expect(clientOption).toBeVisible({ timeout: 15000 });
  await clientOption.click();

  const qtyYearInput = modal.locator('input[name="clients.0.qty_per_year"]');
  await expect(qtyYearInput).toBeVisible({ timeout: 15000 });

  const randomQtyYear = String(Math.floor(Math.random() * 1000) + 1);
  await qtyYearInput.fill(randomQtyYear);
}

async function updateProduct(modal) {
  const updateButton = modal.getByRole('button', {
    name: /^update$/i,
  }).last();

  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
}

test.describe.serial('Products / Services edit flow', () => {
  test('01. Delete client from product', async ({ page }) => {
    await login(page);
    await openProductsServicesPage(page);

    await openProductDetails(page, PRODUCT_WITH_CLIENT);

    const modal = await openEditModal(page);

    await deleteClientFromProduct(page, modal);

    await updateProduct(modal);

    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('body')).toContainText(
      /updated|success|saved|edited/i,
      { timeout: 15000 }
    );
  });

  test('02. Add client to product', async ({ page }) => {
    await login(page);
    await openProductsServicesPage(page);

    await openProductDetails(page, PRODUCT_WITHOUT_CLIENT);

    const modal = await openEditModal(page);

    await addClientToProduct(page, modal);

    await updateProduct(modal);

    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('body')).toContainText(
      /updated|success|saved|edited/i,
      { timeout: 15000 }
    );
  });
});