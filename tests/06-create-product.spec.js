import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, PRODUCT_NAME } from './config';
import { createClient } from './helpers/client.helper';
import {
  openCreateProductModal,
  fillProductBaseFields,
  goToAttachClientsStep,
  attachClientToProduct,
  findProductCard,
} from './helpers/product.helper';
import { gotoProducts } from './helpers/navigation';

// Generic fixture data covering all four Revenue Types (Item / Subscription
// / Hourly / Donate) — see PROJECT_KNOWLEDGE.md §3.2.
const PRODUCTS = [
  // "Item" was renamed "One-time" in the live app (PROJECT_KNOWLEDGE.md
  // §3.2 still says "Item" as of 2026-08-06 — confirmed drift, see
  // BUG_PATTERNS.md).
  { name: unique(PRODUCT_NAME), revenueType: 'One-time', sellingPrice: '1000', variableProductionCost: '300' },
  { name: unique(`${PRODUCT_NAME} Subscription`), revenueType: 'Subscription', sellingPrice: '50', variableProductionCost: '10' },
  { name: unique(`${PRODUCT_NAME} Hourly`), revenueType: 'Hourly', sellingPrice: '75', variableProductionCost: '20' },
  // Selling price is required and non-zero even for "Donate" — the app
  // rejects "0" as if the field were empty ("Price is required"), confirmed
  // live. A symbolic nominal price stands in for "given away" here.
  { name: unique(`${PRODUCT_NAME} Donate`), revenueType: 'Donate', sellingPrice: '1', variableProductionCost: '0' },
].map((p) => ({ ...p, description: `Product created by the automated test suite (${p.revenueType}).` }));

test.describe.serial('Products / Services flow', () => {
  let clientName;

  test('01. Validation for empty product form', async ({ page, project }) => {
    await login(page);
    await gotoProducts(page, project);

    const modal = await openCreateProductModal(page);
    await modal.getByRole('button', { name: /^next$/i }).first().click();

    await expect(page.getByText(/required|can't be blank|must be at least/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('02. Create first product with an attached client', async ({ page, project }) => {
    await login(page);
    const client = await createClient(page, project, { name: unique('Autotest Attach Client') });
    clientName = client.name;

    await gotoProducts(page, project);
    const modal = await openCreateProductModal(page);
    await fillProductBaseFields(page, modal, PRODUCTS[0]);
    await goToAttachClientsStep(modal);
    await attachClientToProduct(page, modal, clientName);

    await modal.getByRole('button', { name: /^create$/i }).last().click();
    await expect(modal).not.toBeVisible({ timeout: 15000 });
    await findProductCard(page, PRODUCTS[0].name);
  });

  test('03. Create remaining products (one per Revenue Type)', async ({ page, project }) => {
    test.setTimeout(150_000);
    await login(page);

    for (const product of PRODUCTS.slice(1)) {
      await gotoProducts(page, project);
      const modal = await openCreateProductModal(page);
      await fillProductBaseFields(page, modal, product);
      await goToAttachClientsStep(modal);

      await modal.getByRole('button', { name: /^create$/i }).last().click();
      await expect(modal).not.toBeVisible({ timeout: 15000 });
      await gotoProducts(page, project);
      await findProductCard(page, product.name);
    }
  });
});
