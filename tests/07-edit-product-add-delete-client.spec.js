import { test } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique } from './config';
import { createClient } from './helpers/client.helper';
import {
  createProduct,
  openProductDetails,
  openEditProductModal,
  openAttachClientsTab,
  detachClientFromProduct,
  attachClientToProduct,
  submitProductUpdate,
} from './helpers/product.helper';
import { gotoProducts } from './helpers/navigation';

// Self-contained: creates its own product with its own attached client
// instead of guessing which of two shared products currently holds an
// attachment (the old version's workaround for re-run idempotency — see
// BUG_PATTERNS.md "Duplicate Products..."). A fresh, uniquely-named product
// every run removes the ambiguity entirely.
test.describe.serial('Products / Services edit flow', () => {
  let productName;
  let clientName;

  test('00. Set up product with an attached client', async ({ page, project }) => {
    await login(page);
    const client = await createClient(page, project, { name: unique('Autotest Edit Client') });
    clientName = client.name;

    const product = await createProduct(page, project, {
      name: unique('Autotest Edit Product'),
      clientName,
    });
    productName = product.name;
  });

  test('01. Delete client from product', async ({ page, project }) => {
    await login(page);
    await gotoProducts(page, project);
    await openProductDetails(page, productName);

    const modal = await openEditProductModal(page);
    await openAttachClientsTab(modal);
    await detachClientFromProduct(page, modal, clientName);
    await submitProductUpdate(modal);
  });

  test('02. Add client back to product', async ({ page, project }) => {
    await login(page);
    await gotoProducts(page, project);
    await openProductDetails(page, productName);

    const modal = await openEditProductModal(page);
    await openAttachClientsTab(modal);
    await attachClientToProduct(page, modal, clientName);
    await submitProductUpdate(modal);
  });
});
