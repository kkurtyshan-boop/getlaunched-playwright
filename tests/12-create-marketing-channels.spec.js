import { test, expect } from '@playwright/test';
import { login, PROJECT_NAME } from './helpers';


const CLIENT_MAKEUP = 'Makeup-ентузіасти Dior (20-45) _test';
const CLIENT_PERFUME = 'Преміум-колекціонери ароматів (15-35) _test';
const CLIENT_SKINCARE = 'Засоби для догляду за "ідеальною" шкірою... _test';
const CLIENT_GIFTS = 'Покупці "подарунків" (усі вікові) _test';

const CHANNELS_TO_CREATE = [
  {
    name: 'Dior Instagram Campaign',
    category: 'Social media',
    client: CLIENT_MAKEUP,
    strategy:
      'Візуальні reels та карусель-пости з новинками макіяжу Dior для залучення молодої аудиторії.',
    monthlyBudget: '45000',
    reach: '120000',
    conversionToLead: '4',
    conversionToCustomer: '2',
  },
  {
    name: 'Dior Google Ads — Parfum Search',
    category: 'Paid search (Google Ads)',
    client: CLIENT_PERFUME,
    strategy:
      'Пошукова реклама за брендовими та категорійними запитами про парфуми Dior.',
    monthlyBudget: '60000',
    reach: '80000',
    conversionToLead: '6',
    conversionToCustomer: '3',
  },
  {
    name: 'Dior Blog & SEO Content',
    category: 'SEO & content',
    client: CLIENT_SKINCARE,
    strategy:
      'Контент-маркетинг та SEO-статті про догляд за шкірою та anti-age рутину Dior.',
    monthlyBudget: '25000',
    reach: '50000',
    conversionToLead: '3',
    conversionToCustomer: '1',
  },
  {
    name: 'Dior VIP Email Newsletter',
    category: 'Email marketing',
    client: CLIENT_PERFUME,
    strategy:
      'Розсилка для лояльних клієнтів з ексклюзивними пропозиціями та лімітованими колекціями.',
    monthlyBudget: '15000',
    reach: '30000',
    conversionToLead: '8',
    conversionToCustomer: '5',
  },
  {
    name: 'Dior Pop-up Event Paris',
    category: 'Events & PR',
    client: CLIENT_GIFTS,
    strategy:
      'Офлайн pop-up подія з презентацією нової подарункової колекції Dior.',
    monthlyBudget: '90000',
    reach: '15000',
    conversionToLead: '10',
    conversionToCustomer: '6',
  },
  {
    name: 'Dior Boutique Direct Sales',
    category: 'Direct sales',
    client: CLIENT_SKINCARE,
    strategy:
      'Персональні консультації та продажі в бутиках Dior для клієнтів по догляду за шкірою.',
    monthlyBudget: '35000',
    reach: '10000',
    conversionToLead: '15',
    conversionToCustomer: '9',
  },
  {
    name: 'Dior Client Referral Program',
    category: 'Referral',
    client: CLIENT_MAKEUP,
    strategy:
      'Програма "приведи друга" з бонусами для існуючих шанувальників макіяжу Dior.',
    monthlyBudget: '10000',
    reach: '5000',
    conversionToLead: '12',
    conversionToCustomer: '7',
  },
  {
    name: 'Dior Influencer Collaboration',
    category: 'Other',
    customCategoryName: 'Influencer & UGC',
    client: CLIENT_GIFTS,
    strategy:
      'Колаборації з інфлюенсерами для промо подарункових наборів Dior у соцмережах.',
    monthlyBudget: '55000',
    reach: '95000',
    conversionToLead: '5',
    conversionToCustomer: '2',
  },
];
async function openOperationsPage(page) {
  await page.goto('/', {
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
}

async function openCreateChannelModal(page) {
  const createChannelButton = page
    .getByRole('button', { name: /create channel/i })
    .first();

  await expect(createChannelButton).toBeVisible({ timeout: 15000 });
  await createChannelButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel) {
  const dropdownButton = scope
    .locator('button[data-open="false"]')
    .nth(dropdownIndex);

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

async function fillChannelStep(page, modal, channel) {
  const nameField = modal.getByPlaceholder('Type channel name').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(channel.name);

  await selectFromCustomDropdown(page, modal, 0, channel.category);
  await page.waitForTimeout(200);

  // "Other" category reveals an extra required free-text category name field
  const customCategoryField = modal.getByPlaceholder(/type category name/i).first();
  if (await customCategoryField.count()) {
    await customCategoryField.fill(channel.customCategoryName);
  }

  await selectFromCustomDropdown(page, modal, 1, channel.client);
  await page.waitForTimeout(200);

  const strategyField = modal.getByPlaceholder('Write your story...').first();
  await expect(strategyField).toBeVisible({ timeout: 15000 });
  await strategyField.fill(channel.strategy);
}

async function goToSalesFunnelsStep(modal) {
  const nextButton = modal.getByRole('button', { name: /^next$/i }).first();

  await expect(nextButton).toBeVisible({ timeout: 15000 });
  await nextButton.click();

  // "sales funnels" also appears in the step tab label on step 1 — wait for a
  // field that only exists once step 2 actually renders.
  await expect(modal.getByPlaceholder(/type budget/i).first()).toBeVisible({
    timeout: 15000,
  });
}

async function fillSalesFunnelsStep(modal, channel) {
  const budgetField = modal.getByPlaceholder(/type budget/i).first();
  await expect(budgetField).toBeVisible({ timeout: 15000 });
  await budgetField.fill(channel.monthlyBudget);

  const reachField = modal.getByPlaceholder(/type reach/i).first();
  await expect(reachField).toBeVisible({ timeout: 15000 });
  await reachField.fill(channel.reach);

  const leadField = modal.getByPlaceholder(/type lead/i).first();
  await expect(leadField).toBeVisible({ timeout: 15000 });
  await leadField.fill(channel.conversionToLead);

  const conversionField = modal.getByPlaceholder(/type conversion/i).first();
  await expect(conversionField).toBeVisible({ timeout: 15000 });
  await conversionField.fill(channel.conversionToCustomer);
}

async function createChannel(page, channel) {
  const modal = await openCreateChannelModal(page);

  await fillChannelStep(page, modal, channel);
  await goToSalesFunnelsStep(modal);
  await fillSalesFunnelsStep(modal, channel);

  const createButton = modal.getByRole('button', { name: /^create$/i }).last();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.locator('body')).toContainText(
    /created|success|saved|added/i,
    { timeout: 15000 }
  );
}

test.describe.serial('Marketing channels flow', () => {
  test('01. Validation for empty channel form', async ({ page }) => {
    await login(page);
    await openOperationsPage(page);

    const modal = await openCreateChannelModal(page);

    const nextButton = modal.getByRole('button', { name: /^next$/i }).first();
    await expect(nextButton).toBeVisible({ timeout: 15000 });
    await nextButton.click();

    await expect(
      page.getByText(/required|must be at least|can't be blank/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('02. Create marketing channels for all categories', async ({ page }) => {
    // 8 channels, 2-step wizard each — well beyond the default 30s timeout
    test.setTimeout(240_000);

    await login(page);
    await openOperationsPage(page);

    for (const channel of CHANNELS_TO_CREATE) {
      await createChannel(page, channel);
    }
  });
});
