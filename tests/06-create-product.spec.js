import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const FIRST_PRODUCT = {
  name: 'Eau de Parfum Dior — Signature (50 мл)',
  description:
    'Парфумована вода Dior для щоденного використання: стійкий шлейф, преміальна якість композиції.',
  revenueType: 'Item',
  sellingPrice: '54 000',
  variableProductionCost: '16 500',
};

const PRODUCTS = [
  {
    name: "Parfum Intense Dior — L'Imperiale (30 мл)",
    description:
      'Інтенсивні парфуми Dior для особливих подій: глибокий характер і довгий шлейф.',
    revenueType: 'Subscription',
    sellingPrice: '63000',
    variableProductionCost: '19500',
  },
  {
    name: 'Сироватка для обличчя Dior — Capture / Hydra (30 мл)',
    description:
      'Преміальна сироватка: інтенсивне зволоження та підживлення шкіри сяйвом.',
    revenueType: 'Hourly',
    sellingPrice: '42000',
    variableProductionCost: '12000',
  },
  {
    name: 'Крем для обличчя Dior — Anti-Age / Зволоження (50 мл)',
    description:
      'Живильний anti-age крем: комфорт, зволоження та пружність шкіри.',
    revenueType: 'Donate',
    sellingPrice: '48000',
    variableProductionCost: '13500',
  },
];

const CLIENT_NAME = 'Преміум-колекціонери ароматів (15-35) _test';

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

async function openProductsServicesPage(page) {
  await page.goto('https://frontv2.getlaunched.io/', {
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

async function openCreateProductModal(page) {
  const createProductButton = page
    .getByRole('button', { name: /^create product$/i })
    .first();

  await expect(createProductButton).toBeVisible({ timeout: 15000 });
  await createProductButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
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

async function goToAttachClientsStep(modal) {
  const nextButton = modal.getByRole('button', { name: /^next$/i }).first();

  await expect(nextButton).toBeVisible({ timeout: 15000 });
  await nextButton.click();

  await expect(modal.getByText(/attach clients/i).first()).toBeVisible({
    timeout: 15000,
  });
}

async function addClientToProduct(modal, page) {
  const addClientButton = modal
    .getByRole('button', { name: /^add client$/i })
    .first();

  await expect(addClientButton).toBeVisible({ timeout: 15000 });
  await addClientButton.click();

  // BUSINESS UNIT — dropdown used to attach the client to the product
  await selectFromCustomDropdown(page, modal, CLIENT_NAME);

  // QUANTITY PER YEAR — the form now shows two year columns, fill both
  const qtyInputs = modal.getByPlaceholder(/type quantity/i);
  const qtyCount = await qtyInputs.count();

  for (let i = 0; i < qtyCount; i++) {
    const randomQty = String(Math.floor(Math.random() * 5000) + 100);
    await qtyInputs.nth(i).fill(randomQty);
  }
}

async function fillProductBaseFields(modal, page, product) {
  const nameField = modal.getByRole('textbox').nth(0);
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(product.name);

  const descriptionField = modal.getByRole('textbox').nth(1);
  await expect(descriptionField).toBeVisible({ timeout: 15000 });
  await descriptionField.fill(product.description);

  await selectFromCustomDropdown(page, modal, product.revenueType);
  await page.waitForTimeout(300);

  const sellingPriceField = modal.locator('#price');
  await expect(sellingPriceField).toBeVisible({ timeout: 15000 });
  await sellingPriceField.fill(product.sellingPrice);

  const variableProductionCostField = modal.locator('#productionCost');
  await expect(variableProductionCostField).toBeVisible({ timeout: 15000 });
  await variableProductionCostField.fill(product.variableProductionCost);
}

test.describe.serial('Products / Services flow', () => {
  test('01. Validation for empty product form', async ({ page }) => {
    await login(page);
    await openProductsServicesPage(page);

    const modal = await openCreateProductModal(page);

    const nextButton = modal.getByRole('button', { name: /^next$/i }).first();
    await expect(nextButton).toBeVisible({ timeout: 15000 });
    await nextButton.click();

    await expect(
      page.getByText(/required|can't be blank|must be at least/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('02. Create first product with client', async ({ page }) => {
    await login(page);
    await openProductsServicesPage(page);

    const modal = await openCreateProductModal(page);

    await fillProductBaseFields(modal, page, FIRST_PRODUCT);

    await goToAttachClientsStep(modal);

    await addClientToProduct(modal, page);

    const createButton = modal.getByRole('button', { name: /^create$/i }).last();
    await expect(createButton).toBeVisible({ timeout: 15000 });
    await createButton.click();

    await expect(page.locator('body')).toContainText(/created|success|added/i, {
      timeout: 15000,
    });
  });

  test('03. Create remaining products', async ({ page }) => {
    await login(page);
    await openProductsServicesPage(page);

    for (const product of PRODUCTS) {
      const modal = await openCreateProductModal(page);

      await fillProductBaseFields(modal, page, product);

      await goToAttachClientsStep(modal);

      const createButton = modal
        .getByRole('button', { name: /^create$/i })
        .last();

      await expect(createButton).toBeVisible({ timeout: 15000 });
      await createButton.click();

      await page.waitForTimeout(2000);
    }
  });
});