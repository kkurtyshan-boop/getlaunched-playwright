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
  openProductDetails,
  openEditProductModal,
  selectFromLabeledDropdown,
  selectRevenueType,
  openProductStep,
  REVENUE_PER_ITEM,
  REVENUE_HOURLY,
  REVENUE_SUBSCRIPTION,
  REVENUE_DONATION,
  REVENUE_COMMISSION,
  COST_TYPE_COGS,
  COST_TYPE_OTHER_DIRECT,
  SUBSCRIPTION_MONTHLY,
  SUBSCRIPTION_ANNUAL,
} from './helpers/product.helper';
import { gotoProducts } from './helpers/navigation';

// Generic fixture data covering all five Revenue types (Per item /
// Subscription / Hourly / Donation / Commission) — see PROJECT_KNOWLEDGE.md §3.2.
const PRODUCTS = [
  { name: unique(PRODUCT_NAME), revenueType: REVENUE_PER_ITEM, sellingPrice: '1000', variableProductionCost: '300' },
  {
    name: unique(`${PRODUCT_NAME} Subscription`),
    revenueType: REVENUE_SUBSCRIPTION,
    sellingPrice: '50',
    variableProductionCost: '10',
    subscriptionType: SUBSCRIPTION_MONTHLY,
  },
  { name: unique(`${PRODUCT_NAME} Hourly`), revenueType: REVENUE_HOURLY, sellingPrice: '75', variableProductionCost: '20' },
  // Selling price is required and non-zero even for Donation — the app
  // rejects "0" as if the field were empty, confirmed live. A symbolic
  // nominal price stands in for "given away" here.
  { name: unique(`${PRODUCT_NAME} Donation`), revenueType: REVENUE_DONATION, sellingPrice: '1', variableProductionCost: '0' },
  // Commission: rate (%) × average deal value instead of a selling price;
  // no Cost type field.
  {
    name: unique(`${PRODUCT_NAME} Commission`),
    revenueType: REVENUE_COMMISSION,
    commissionRate: '5',
    dealValue: '20000',
    variableProductionCost: '100',
  },
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

  // Cost type (added when the Create/Edit product modal was redesigned to
  // add Sourcing/Cost type/Subscription type — PROJECT_KNOWLEDGE.md §3.2)
  // classifies a product's variable cost as either COGS (creates Inventory)
  // or an Other direct cost (deducted below Gross profit instead). The
  // dropdown's own helper text is the only in-modal signal of this, so
  // assert on it directly rather than on downstream financials, which are
  // out of scope for this spec.
  test('04. Cost type toggle updates the in-modal classification hint', async ({ page, project }) => {
    await login(page);
    await gotoProducts(page, project);

    const modal = await openCreateProductModal(page);
    await modal.locator('#name').fill(unique(`${PRODUCT_NAME} Cost Hint`));
    await modal.getByRole('button', { name: /^next$/i }).click();
    await selectRevenueType(modal, REVENUE_PER_ITEM);
    await expect(modal.getByText(/creates inventory in the balance sheet/i)).toBeVisible({ timeout: 15000 });

    await selectFromLabeledDropdown(page, modal, 'Cost type', COST_TYPE_OTHER_DIRECT);
    await expect(modal.getByText(/no inventory.+deducted below gross profit/i)).toBeVisible({ timeout: 15000 });

    await selectFromLabeledDropdown(page, modal, 'Cost type', COST_TYPE_COGS);
    await expect(modal.getByText(/creates inventory in the balance sheet/i)).toBeVisible({ timeout: 15000 });
  });

  // Acceptance criteria (see task): a product with cost_type = other_direct
  // must still be creatable end-to-end and must persist its classification.
  // Margin per unit is auto-computed (read-only text) — assert it
  // alongside since it shares this step.
  test('05. Create a product with cost_type = Other direct cost (service business)', async ({ page, project }) => {
    const product = {
      name: unique(`${PRODUCT_NAME} Other-Direct`),
      description: 'Expert fees product — cost should NOT create Inventory (other_direct).',
      revenueType: REVENUE_PER_ITEM,
      sellingPrice: '500',
      variableProductionCost: '150',
      costType: COST_TYPE_OTHER_DIRECT,
    };

    await login(page);
    await gotoProducts(page, project);
    const modal = await openCreateProductModal(page);
    await fillProductBaseFields(page, modal, product);
    // Margin is now read-only text: label "Margin per unit" + sibling value
    // "₣ 350.00 · 70%" — assert on their closest common ancestor.
    await expect(modal.getByText(/^margin per unit$/i).locator('xpath=ancestor::*[contains(., "·")][1]')).toContainText('350.00');

    await goToAttachClientsStep(modal);
    await modal.getByRole('button', { name: /^create$/i }).last().click();
    await expect(modal).not.toBeVisible({ timeout: 15000 });
    await findProductCard(page, product.name);

    // Persistence check: re-open via Edit and confirm Cost type stuck as
    // Other direct cost rather than silently reverting to the COGS default.
    await openProductDetails(page, product.name);
    const editModal = await openEditProductModal(page);
    await openProductStep(editModal, 'Pricing');
    await expect(editModal.getByText(/no inventory.+deducted below gross profit/i)).toBeVisible({ timeout: 15000 });
    await editModal.getByRole('button', { name: /^cancel$/i }).click();
  });

  // Acceptance criteria: Subscription products need a payment period —
  // Monthly (×12 in Financial) or Annual (single yearly payment). The
  // Products list card's price-cadence badge is KNOWN to always render
  // "/Month" regardless of the selected Subscription type — see
  // BUG_PATTERNS.md "Subscription Payment Period Badge Always Shows
  // '/Month'". Assert on the persisted Edit-modal value (confirmed correct
  // on the backend) rather than the card badge, so this test doesn't flap
  // on a UI-display-only bug that's already tracked separately.
  test('06. Create an Annual subscription product and verify the period persists', async ({ page, project }) => {
    const product = {
      name: unique(`${PRODUCT_NAME} Annual Subscription`),
      description: 'Annual-billed subscription — Financial should count this as one yearly payment, not sum×12.',
      revenueType: REVENUE_SUBSCRIPTION,
      sellingPrice: '600',
      variableProductionCost: '100',
      subscriptionType: SUBSCRIPTION_ANNUAL,
    };

    await login(page);
    await gotoProducts(page, project);
    const modal = await openCreateProductModal(page);
    await fillProductBaseFields(page, modal, product);

    await goToAttachClientsStep(modal);
    await modal.getByRole('button', { name: /^create$/i }).last().click();
    await expect(modal).not.toBeVisible({ timeout: 15000 });
    await findProductCard(page, product.name);

    await openProductDetails(page, product.name);
    const editModal = await openEditProductModal(page);
    await openProductStep(editModal, 'Pricing');
    // Each custom dropdown mirrors its value into a hidden native <select>
    // for form semantics, so a plain getByText() double-matches (visible
    // button + hidden option) — scope to the dropdown button itself.
    await expect(editModal.locator('button').filter({ hasText: SUBSCRIPTION_ANNUAL })).toBeVisible({
      timeout: 15000,
    });
    await editModal.getByRole('button', { name: /^cancel$/i }).click();
  });
});
