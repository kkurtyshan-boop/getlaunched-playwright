import { expect } from '@playwright/test';
import { gotoProducts } from './navigation';
import { PRODUCT_NAME, unique } from '../config';

export async function openCreateProductModal(page) {
  const button = page.getByRole('button', { name: /^create product$/i }).first();
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// The app-wide custom dropdown pattern (CLAUDE.md "Selectors & waits"):
// button[data-open="false"] -> listbox -> option.
export async function selectFromCustomDropdown(page, scope, optionLabel) {
  const dropdownButton = scope.locator('button[data-open="false"]').first();
  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: optionLabel, exact: true }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();

  // Wait for the listbox to actually close before returning — without this,
  // a dropdown opened moments later in the same or a freshly reopened modal
  // can race against this one's still-closing listbox and resolve
  // `getByRole('listbox').last()` to the wrong element.
  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});
}

export async function fillProductBaseFields(page, modal, product) {
  const nameField = modal.getByRole('textbox').nth(0);
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(product.name);

  const descriptionField = modal.getByRole('textbox').nth(1);
  await expect(descriptionField).toBeVisible({ timeout: 15000 });
  await descriptionField.fill(product.description);

  await selectFromCustomDropdown(page, modal, product.revenueType);

  const sellingPriceField = modal.locator('#price');
  await expect(sellingPriceField).toBeVisible({ timeout: 15000 });
  await sellingPriceField.fill(product.sellingPrice);

  const productionCostField = modal.locator('#productionCost');
  await expect(productionCostField).toBeVisible({ timeout: 15000 });
  await productionCostField.fill(product.variableProductionCost);
}

export async function goToAttachClientsStep(modal) {
  const nextButton = modal.getByRole('button', { name: /^next$/i }).first();
  await expect(nextButton).toBeVisible({ timeout: 15000 });
  await nextButton.click();

  await expect(modal.getByText(/attach clients/i).first()).toBeVisible({ timeout: 15000 });
}

export async function attachClientToProduct(page, modal, clientName) {
  const addClientButton = modal.getByRole('button', { name: /^add client$/i }).first();
  await expect(addClientButton).toBeVisible({ timeout: 15000 });
  await addClientButton.click();

  await selectFromCustomDropdown(page, modal, clientName);

  const qtyInputs = modal.getByPlaceholder(/type quantity/i);
  const qtyCount = await qtyInputs.count();
  for (let i = 0; i < qtyCount; i++) {
    await qtyInputs.nth(i).fill(String(100 + i * 25));
  }
}

// Scoped to the row that shows this client's name but not the "Quantity per
// year" block (a sibling section) — isolates the row's own delete button.
export async function detachClientFromProduct(page, modal, clientName) {
  const clientRow = modal
    .locator('div')
    .filter({ hasText: clientName })
    .filter({ hasNotText: /quantity per year/i })
    .first();

  await expect(clientRow).toBeVisible({ timeout: 15000 });

  const deleteRowButton = clientRow.getByRole('button').last();
  await expect(deleteRowButton).toBeVisible({ timeout: 15000 });
  await deleteRowButton.click();

  const confirmDeleteButton = page.getByRole('button', { name: /yes, delete this client/i });
  await expect(confirmDeleteButton).toBeVisible({ timeout: 15000 });
  await confirmDeleteButton.click();
}

// The Products list can grow long on an account with a lot of accumulated
// history (see BUG_PATTERNS.md "Duplicate Products..."); a just-created
// product isn't always in the initially-rendered DOM if the list lazily
// renders more cards on scroll. Poll with a scroll nudge between attempts
// instead of a single visibility check.
export async function findProductCard(page, productName) {
  const card = page.getByText(productName, { exact: false }).first();

  await expect(async () => {
    if (await card.isVisible().catch(() => false)) return;
    await page.mouse.wheel(0, 2000);
    expect(await card.isVisible().catch(() => false)).toBe(true);
  }).toPass({ timeout: 20000, intervals: [500] });

  return card;
}

export async function openProductDetails(page, productName) {
  const card = await findProductCard(page, productName);
  await card.scrollIntoViewIfNeeded();
  await card.click();
}

export async function openEditProductModal(page) {
  const editButton = page.getByRole('button', { name: /^edit$/i }).first();
  await expect(editButton).toBeVisible({ timeout: 15000 });
  await editButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// Edit product form is the same 2-step wizard as Create ("Product" /
// "Attach clients" tabs).
export async function openAttachClientsTab(modal) {
  const tab = modal.getByRole('button', { name: /attach clients/i }).first();
  await expect(tab).toBeVisible({ timeout: 15000 });
  await tab.click();

  await expect(modal.getByText(/^clients \(/i).first()).toBeVisible({ timeout: 15000 });
}

export async function submitProductUpdate(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).last();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
  await expect(modal).not.toBeVisible({ timeout: 15000 });
}

// Creates a product via the real UI 2-step wizard (base fields, optionally
// attaching one client) and returns the fixture used.
export async function createProduct(page, project, overrides = {}) {
  const product = {
    name: overrides.name || unique(PRODUCT_NAME),
    description: overrides.description || 'Product created by the automated test suite.',
    // "Item" was renamed "One-time" in the live app — see BUG_PATTERNS.md.
    revenueType: overrides.revenueType || 'One-time',
    sellingPrice: overrides.sellingPrice || '1000',
    variableProductionCost: overrides.variableProductionCost || '250',
  };

  await gotoProducts(page, project);
  const modal = await openCreateProductModal(page);
  await fillProductBaseFields(page, modal, product);
  await goToAttachClientsStep(modal);

  if (overrides.clientName) {
    await attachClientToProduct(page, modal, overrides.clientName);
    product.clientName = overrides.clientName;
  }

  await modal.getByRole('button', { name: /^create$/i }).last().click();
  // The modal closing is a far more specific success signal than matching
  // loose text anywhere in <body> — the products list already contains
  // words like "added" (client-count badges), which can make a body-text
  // match pass even when the submission actually failed validation.
  await expect(modal).not.toBeVisible({ timeout: 15000 });

  return product;
}
