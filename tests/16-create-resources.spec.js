import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const INVESTMENT_RESOURCES = [
  {
    name: 'Парфумерне виробниче обладнання',
    category: 'Equipment',
    cost: '250000',
    amortizationPeriod: '60',
    startYear: '2027',
    description: 'Лінія розливу та флаконування парфумів на виробничій дільниці.',
  },
  {
    name: 'POS-термінали для бутиків',
    category: 'Hardware',
    cost: '45000',
    amortizationPeriod: '36',
    startYear: '2027',
    description: 'Касові термінали та сканери для мережі бутиків Dior.',
  },
  {
    name: 'Оренда офісного простору у Парижі',
    category: 'Office space',
    cost: '500000',
    amortizationPeriod: '96',
    startYear: '2027',
    description: 'Довгострокова оренда головного офісу бренду.',
  },
  {
    name: 'Складські стелажі та обладнання',
    category: 'Inventory',
    cost: '80000',
    amortizationPeriod: '84',
    startYear: '2028',
    description: 'Обладнання для зберігання парфумів та косметики на складі.',
  },
  {
    name: 'Права на дизайн упаковки',
    category: 'Copyrights',
    cost: '150000',
    amortizationPeriod: '60',
    startYear: '2027',
    description: 'Ексклюзивні права на фірмовий дизайн упаковки колекцій.',
  },
  {
    name: 'Рецептура ароматів Dior',
    category: 'Trade secrets',
    cost: '300000',
    amortizationPeriod: '96',
    startYear: '2028',
    description: 'Захищена рецептура флагманських ароматів бренду.',
  },
  {
    name: 'Брендові вітрини для бутиків',
    category: 'Other',
    cost: '60000',
    amortizationPeriod: '48',
    startYear: '2028',
    description: 'Фірмові вітрини та мерчандайзингове обладнання для точок продажу.',
  },
];

const RUNNING_COSTS_RESOURCES = [
  {
    name: 'Сировина для парфумів',
    category: 'Goods and Materials',
    paymentType: 'Monthly',
    costsPerYear: ['400000', '450000'],
    startYear: '2027',
    description: 'Есенції, спирт та флакони для щомісячного виробництва.',
  },
  {
    name: 'Аутсорс виробництва косметики',
    category: 'External services and Production costs',
    paymentType: 'Annually',
    costsPerYear: ['600000', '650000'],
    startYear: '2027',
    description: 'Контрактне виробництво косметичних ліній третьою стороною.',
  },
  {
    name: 'Оренда та комунальні послуги бутиків',
    category: 'Rent and Utilities',
    paymentType: 'Monthly',
    costsPerYear: ['300000', '320000'],
    startYear: '2027',
    description: 'Щомісячна оренда та комунальні платежі мережі бутиків.',
  },
  {
    name: 'Обслуговування обладнання',
    category: 'Maintenance Repairs and Leasing',
    paymentType: 'Annually',
    costsPerYear: ['50000', '55000'],
    startYear: '2027',
    description: 'Планове технічне обслуговування виробничих ліній.',
  },
  {
    name: 'Логістика та доставка продукції',
    category: 'Vehicle and Transport',
    paymentType: 'Monthly',
    costsPerYear: ['90000', '95000'],
    startYear: '2027',
    description: 'Транспортування продукції між складами та бутиками.',
  },
  {
    name: 'Страхування товарів та митні збори',
    category: 'Insurance fees and Duties',
    paymentType: 'Annually',
    costsPerYear: ['70000', '75000'],
    startYear: '2028',
    description: 'Страхування партій товару та митне оформлення імпорту.',
  },
  {
    name: 'Електроенергія та утилізація відходів',
    category: 'Energy and Waste disposal',
    paymentType: 'Monthly',
    costsPerYear: ['40000', '42000'],
    startYear: '2027',
    description: 'Енергопостачання виробництва та утилізація відходів.',
  },
  {
    name: 'IT-підтримка та адміністрування',
    category: 'Administration and IT',
    paymentType: 'Monthly',
    costsPerYear: ['60000', '65000'],
    startYear: '2027',
    description: 'Підтримка внутрішніх систем та адміністративні витрати.',
  },
  {
    name: 'Рекламні кампанії та промо',
    category: 'Marketing advertising and Sales',
    paymentType: 'Annually',
    costsPerYear: ['280000', '300000'],
    startYear: '2027',
    description: 'Рекламні кампанії, промо-акції та підтримка продажів.',
  },
  {
    name: 'Юридичний та аудиторський супровід',
    category: 'Legal auditing and Consulting',
    paymentType: 'Annually',
    costsPerYear: ['45000', '48000'],
    startYear: '2028',
    description: 'Юридичні консультації та щорічний аудит компанії.',
  },
  {
    name: 'Дослідження нових формул косметики',
    category: 'Research and Development',
    paymentType: 'Annually',
    costsPerYear: ['200000', '220000'],
    startYear: '2028',
    description: 'R&D нових формул парфумів та косметичних засобів.',
  },
  {
    name: 'Банківське обслуговування та відсотки',
    category: 'Financial expenses',
    paymentType: 'Monthly',
    costsPerYear: ['15000', '16000'],
    startYear: '2027',
    description: 'Комісії банку та відсотки за кредитними лініями.',
  },
];

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

async function openResourcesTab(page) {
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

  const resourcesTab = page.getByRole('tab', { name: /^resources$/i }).first();
  await expect(resourcesTab).toBeVisible({ timeout: 15000 });
  await resourcesTab.click();
}

async function openCreateResourceModal(page) {
  const createButton = page
    .getByRole('button', { name: /create new resource/i })
    .first();

  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel) {
  const dropdownButton = scope
    .locator('button[data-open="false"]')
    .nth(dropdownIndex);

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

// Investment tab: Category(0), Payment type(1, disabled/fixed to "One-time payment"), Start year(2)
async function createInvestmentResource(page, modal, resource) {
  const nameField = modal.getByPlaceholder('Type resource name').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(resource.name);

  await selectFromCustomDropdown(page, modal, 0, resource.category);
  await page.waitForTimeout(200);

  const costField = modal.getByPlaceholder(/type cost/i).first();
  await expect(costField).toBeVisible({ timeout: 15000 });
  await costField.fill(resource.cost);

  const amortizationField = modal
    .getByPlaceholder(/type amortization period/i)
    .first();
  await expect(amortizationField).toBeVisible({ timeout: 15000 });
  await amortizationField.fill(resource.amortizationPeriod);

  await selectFromCustomDropdown(page, modal, 2, resource.startYear);
  await page.waitForTimeout(200);

  const descriptionField = modal.getByPlaceholder('Write your story...').first();
  await expect(descriptionField).toBeVisible({ timeout: 15000 });
  await descriptionField.fill(resource.description);

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.locator('body')).toContainText(
    /created|success|saved|added/i,
    { timeout: 15000 }
  );
}

// Running costs tab: same field positions, but Payment type(1) is enabled and
// the single "Cost" field is replaced by a "Cost per year" (2027/2028) pair.
async function createRunningCostResource(page, modal, resource) {
  const runningCostsRadio = modal
    .getByRole('radio', { name: /running costs/i })
    .first();
  await expect(runningCostsRadio).toBeVisible({ timeout: 15000 });
  await runningCostsRadio.click();
  await page.waitForTimeout(300);

  const nameField = modal.getByPlaceholder('Type resource name').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(resource.name);

  await selectFromCustomDropdown(page, modal, 0, resource.category);
  await page.waitForTimeout(200);

  await selectFromCustomDropdown(page, modal, 1, resource.paymentType);
  await page.waitForTimeout(200);

  // Year columns are fixed (2027, 2028...) — a year before the resource's start
  // year is rejected by validation, so skip filling it.
  const startYearNum = parseInt(resource.startYear, 10);
  const costInputs = modal.getByPlaceholder(/type cost/i);
  const costCount = await costInputs.count();
  for (let i = 0; i < costCount; i++) {
    const columnYear = 2027 + i;
    if (columnYear < startYearNum) continue;
    await costInputs.nth(i).fill(resource.costsPerYear[i]);
  }

  await selectFromCustomDropdown(page, modal, 2, resource.startYear);
  await page.waitForTimeout(200);

  const descriptionField = modal.getByPlaceholder('Write your story...').first();
  await expect(descriptionField).toBeVisible({ timeout: 15000 });
  await descriptionField.fill(resource.description);

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.locator('body')).toContainText(
    /created|success|saved|added/i,
    { timeout: 15000 }
  );
}

test.describe.serial('Resources flow', () => {
  test('01. Create investment resources for all categories', async ({ page }) => {
    // 7 resources created sequentially — well beyond the default 30s timeout
    test.setTimeout(300_000);

    await login(page);
    await openResourcesTab(page);

    for (const resource of INVESTMENT_RESOURCES) {
      const modal = await openCreateResourceModal(page);
      await createInvestmentResource(page, modal, resource);
    }
  });

  test('02. Create running costs resources for all categories', async ({ page }) => {
    // 12 resources created sequentially — well beyond the default 30s timeout
    test.setTimeout(480_000);

    await login(page);
    await openResourcesTab(page);

    for (const resource of RUNNING_COSTS_RESOURCES) {
      const modal = await openCreateResourceModal(page);
      await createRunningCostResource(page, modal, resource);
    }
  });
});
