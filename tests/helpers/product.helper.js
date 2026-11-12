import { expect } from '@playwright/test';
import { gotoProducts } from './navigation';
import { PRODUCT_NAME, unique } from '../config';
import { escapeRegExp, selectDropdownByLabel } from './dom';

// Create/Edit product is a 3-step wizard as of 2026-11-11:
//   1 General  — Name (#name), Description (#description), photo
//   2 Pricing  — Revenue type radiogroup, price fields, Cost type,
//                Subscription type (Subscription only), Sourcing, Variable
//                production cost (#productionCost), read-only margin text
//   3 Clients  — Add client → Business unit* dropdown + Quantity per year
// See PROJECT_KNOWLEDGE.md §3.2.

// Revenue type radio labels ("Per item" was "One-time"/"Item", "Donation"
// was "Donate"; "Commission" is new).
export const REVENUE_PER_ITEM = 'Per item';
export const REVENUE_HOURLY = 'Hourly';
export const REVENUE_SUBSCRIPTION = 'Subscription';
export const REVENUE_DONATION = 'Donation';
export const REVENUE_COMMISSION = 'Commission';

// Cost type drives Income Statement classification: COGS (creates
// Inventory) vs. Other direct costs. Not shown for Commission.
export const COST_TYPE_COGS = 'Cost of goods sold - held in stock';
export const COST_TYPE_OTHER_DIRECT = 'Other direct cost - services, fees';

// Only rendered when Revenue type = Subscription. Drives ×12 (Monthly) vs.
// single-payment (Annual) math downstream in Financial → Forecasts & Reports.
export const SUBSCRIPTION_MONTHLY = 'Monthly subscription';
export const SUBSCRIPTION_ANNUAL = 'Annual subscription';

export const SOURCING_MAKE = 'Make';
export const SOURCING_BUY = 'Buy';

export async function openCreateProductModal(page) {
  const button = page.getByRole('button', { name: /^create product$/i }).first();
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// The app-wide custom dropdown pattern (CLAUDE.md "Selectors & waits"):
// button[data-open="false"] -> listbox -> option. Only safe when `scope`
// contains a single dropdown (e.g. the Attach Clients step) — use
// selectFromLabeledDropdown() below when several dropdowns share a step.
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

// Pricing step renders several custom dropdowns at once (Cost type,
// Subscription type, Sourcing) — scope to the field via its label text
// ("Cost type*", "Sourcing*", ...).
export async function selectFromLabeledDropdown(page, scope, labelText, optionLabel) {
  await selectDropdownByLabel(page, scope, new RegExp(`^${escapeRegExp(labelText)}\\s*\\*?$`, 'i'), optionLabel);
}

// Wizard step buttons: "1 General" / "2 Pricing" / "3 Clients" (the active
// step's number is replaced by an icon, so match on the trailing word).
export async function openProductStep(modal, stepName) {
  const stepButton = modal.getByRole('button', { name: new RegExp(`^\\d?\\s*${stepName}$`, 'i') }).first();
  await expect(stepButton).toBeVisible({ timeout: 15000 });
  await stepButton.click();
}

export async function selectRevenueType(modal, revenueType) {
  const radio = modal.getByRole('radio', { name: new RegExp(`^${escapeRegExp(revenueType)}\\b`, 'i') });
  await expect(radio).toBeVisible({ timeout: 15000 });
  await radio.check();
}

// Fills steps 1 (General) and 2 (Pricing) and leaves the wizard on Pricing.
export async function fillProductBaseFields(page, modal, product) {
  const nameField = modal.locator('#name');
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(product.name);

  if (product.description) {
    await modal.locator('#description').fill(product.description);
  }

  await modal.getByRole('button', { name: /^next$/i }).click();
  await selectRevenueType(modal, product.revenueType);

  if (product.revenueType === REVENUE_COMMISSION) {
    await modal.locator('#commissionRate').fill(product.commissionRate);
    await modal.locator('#dealValue').fill(product.dealValue);
  } else {
    const sellingPriceField = modal.locator('#price');
    await expect(sellingPriceField).toBeVisible({ timeout: 15000 });
    await sellingPriceField.fill(product.sellingPrice);
    await selectFromLabeledDropdown(page, modal, 'Cost type', product.costType || COST_TYPE_COGS);
  }

  if (product.revenueType === REVENUE_SUBSCRIPTION) {
    await selectFromLabeledDropdown(page, modal, 'Subscription type', product.subscriptionType || SUBSCRIPTION_MONTHLY);
  }

  await selectFromLabeledDropdown(page, modal, 'Sourcing', product.sourcing || SOURCING_MAKE);

  if (product.variableProductionCost !== undefined) {
    await modal.locator('#productionCost').fill(product.variableProductionCost);
  }
}

export async function goToAttachClientsStep(modal) {
  await modal.getByRole('button', { name: /^next$/i }).click();
  await expect(modal.getByRole('heading', { name: /^clients \(\d+\)$/i })).toBeVisible({ timeout: 15000 });
}

// Adds a client row and picks `clientName` in its "Business unit*"
// dropdown (the newest row is the last one), then fills its Quantity per
// year inputs (one per planning-horizon year).
export async function attachClientToProduct(page, modal, clientName) {
  const addClientButton = modal.getByRole('button', { name: /^add client$/i }).first();
  await expect(addClientButton).toBeVisible({ timeout: 15000 });
  await addClientButton.click();

  const unitLabel = modal.getByText(/^business unit\s*\*?$/i).last();
  await expect(unitLabel).toBeVisible({ timeout: 15000 });
  await unitLabel.locator('xpath=following::button[@data-open][1]').click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });
  await listbox.getByRole('option', { name: clientName, exact: true }).click();
  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});

  const qtyInputs = modal.getByPlaceholder(/type quantity/i);
  const qtyCount = await qtyInputs.count();
  for (let i = 0; i < qtyCount; i++) {
    if (!(await qtyInputs.nth(i).inputValue())) {
      await qtyInputs.nth(i).fill(String(100 + i * 25));
    }
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

// Edit product form is the same 3-step wizard as Create.
export async function openAttachClientsTab(modal) {
  await openProductStep(modal, 'Clients');
  await expect(modal.getByRole('heading', { name: /^clients \(\d+\)$/i })).toBeVisible({ timeout: 15000 });
}

export async function submitProductUpdate(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).last();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
  await expect(modal).not.toBeVisible({ timeout: 15000 });
}

// Creates a product via the real UI wizard (General + Pricing, optionally
// attaching one client) and returns the fixture used.
export async function createProduct(page, project, overrides = {}) {
  const product = {
    name: overrides.name || unique(PRODUCT_NAME),
    description: overrides.description || 'Product created by the automated test suite.',
    revenueType: overrides.revenueType || REVENUE_PER_ITEM,
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
