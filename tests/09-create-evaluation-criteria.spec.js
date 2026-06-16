import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const CRITERIA_TO_CREATE = [
  {
    name: 'Відповідність ринку/позиціонуванню',
    score: '2',
  },
  {
    name: 'Продуктова цінність',
    score: '5',
  },
  {
    name: 'Зручність для користувача (UX)',
    score: '7',
  },
  {
    name: 'Цінність за гроші (Pricing & Value)',
    score: '10',
  },
];

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

async function openCompetitorsPage(page) {
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

  const competitorsButton = page.getByText(/competitors/i).first();
  await expect(competitorsButton).toBeVisible({ timeout: 15000 });
  await competitorsButton.click();

  await expect(page.locator('body')).toContainText(/competitors/i, {
    timeout: 15000,
  });
}

async function openCreateModalFromBlock(page, blockTitle) {
  const block = page.locator('section').filter({
    has: page.getByRole('heading', {
      name: new RegExp(`^${escapeRegExp(blockTitle)}$`, 'i'),
    }),
  }).first();

  await expect(block).toBeVisible({ timeout: 15000 });

  const addButton = block.locator('div.pb-4 > button').first();
  await expect(addButton).toBeVisible({ timeout: 15000 });
  await addButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

async function validateCreateForm(modal) {
  const createButton = modal.getByRole('button', { name: /^create$/i }).first();

  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await expect(modal).toBeVisible({ timeout: 5000 });

  const validationMessage = modal
    .locator('text=/required|invalid|error|please fill|must/i')
    .first();

  await expect(validationMessage).toBeVisible({ timeout: 5000 });
}

async function fillFirstMatchingInput(modal, selectors, value) {
  for (const selector of selectors) {
    const field = modal.locator(selector).first();
    if (await field.count()) {
      await expect(field).toBeVisible({ timeout: 15000 });
      await field.fill(value);
      return;
    }
  }

  throw new Error(`Could not find input for value: ${value}`);
}

async function selectScore(modal, score) {
  const radio = modal.getByRole('radio', { name: new RegExp(`^${score}$`) }).first();

  await expect(radio).toBeVisible({ timeout: 15000 });
  await radio.click();
}

async function createEvaluationCriterion(page, criterion) {
  const modal = await openCreateModalFromBlock(page, 'Evaluation criteria');

  await fillFirstMatchingInput(
    modal,
    [
      'input[name*=".name"]',
      'input[name*="name"]',
      'input[placeholder*="Name"]',
      'input[type="text"]',
    ],
    criterion.name
  );

  await selectScore(modal, criterion.score);

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('body')).toContainText(
    /created|success|saved|added|updated/i,
    { timeout: 15000 }
  );
}

test.describe.serial('Evaluation criteria flow', () => {
  test('01. Evaluation criteria - validation on create', async ({ page }) => {
    await login(page);
    await openCompetitorsPage(page);

    const modal = await openCreateModalFromBlock(page, 'Evaluation criteria');
    await validateCreateForm(modal);
  });

  test('02. Create evaluation criteria', async ({ page }) => {
    await login(page);
    await openCompetitorsPage(page);

    for (const criterion of CRITERIA_TO_CREATE) {
      await createEvaluationCriterion(page, criterion);
    }
  });
});