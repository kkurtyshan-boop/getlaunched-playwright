import { test, expect } from '@playwright/test';
import { login, PROJECT_NAME } from './helpers';


const PRODUCT_WITH_CLIENT = 'Eau de Parfum Dior — Signature';
const PRODUCT_WITHOUT_CLIENT = "Parfum Intense Dior — L'Imperiale";
const CLIENT_NAME = 'Преміум-колекціонери ароматів (15-35) _test';
async function openProductsServicesPage(page) {
  await page.goto('/', {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

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

// Edit product form is now a 2-step wizard (same as Create product): "Product" and "Attach clients" tabs
async function openAttachClientsTab(modal) {
  const attachClientsTab = modal
    .getByRole('button', { name: /attach clients/i })
    .first();

  await expect(attachClientsTab).toBeVisible({ timeout: 15000 });
  await attachClientsTab.click();

  await expect(modal.getByText(/^clients \(/i).first()).toBeVisible({
    timeout: 15000,
  });
}

async function selectFromCustomDropdown(page, scope, optionLabel) {
  const dropdownButton = scope.locator('button[data-open="false"]').first();

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

async function deleteClientFromProduct(page, modal) {
  // Scope to the row that shows this client's name but not the "Quantity per year"
  // block (a sibling section) — that isolates the row's own delete icon button.
  const clientRow = modal
    .locator('div')
    .filter({ hasText: CLIENT_NAME })
    .filter({ hasNotText: /quantity per year/i })
    .first();

  await expect(clientRow).toBeVisible({ timeout: 15000 });

  const deleteRowButton = clientRow.getByRole('button').last();

  await expect(deleteRowButton).toBeVisible({ timeout: 15000 });
  await deleteRowButton.click();

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

  // BUSINESS UNIT — dropdown used to attach the client to the product
  await selectFromCustomDropdown(page, modal, CLIENT_NAME);

  // QUANTITY PER YEAR — the form shows two year columns, fill both
  const qtyInputs = modal.getByPlaceholder(/type quantity/i);
  const qtyCount = await qtyInputs.count();

  for (let i = 0; i < qtyCount; i++) {
    const randomQty = String(Math.floor(Math.random() * 5000) + 100);
    await qtyInputs.nth(i).fill(randomQty);
  }
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

    await openAttachClientsTab(modal);

    await deleteClientFromProduct(page, modal);

    await updateProduct(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
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

    await openAttachClientsTab(modal);

    await addClientToProduct(page, modal);

    await updateProduct(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(
      /updated|success|saved|edited/i,
      { timeout: 15000 }
    );
  });
});