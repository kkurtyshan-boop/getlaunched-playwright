import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const MATRIX_ROWS = [
  {
    criterion: 'Відповідність ринку/позиціонуванню',
    scores: [1, 3, 9, 4, 3],
  },
  {
    criterion: 'Продуктова цінність',
    scores: [4, 7, 9, 9, 6],
  },
  {
    criterion: 'Зручність для користувача (UX)',
    scores: [10, 6, 8, 1, 1],
  },
];

const EXPECTED_WEIGHTED_SCORES = ['6.6', '5.9', '8.5', '4.3', '3.1'];

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

async function getEvaluationMatrixSection(page) {
  const section = page.locator('section').filter({
    has: page.getByRole('heading', { name: /evaluation matrix/i }),
  }).first();

  await expect(section).toBeVisible({ timeout: 15000 });
  await section.scrollIntoViewIfNeeded();

  return section;
}

async function selectDropdownScore(page, trigger, score) {
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const listbox = page.getByRole('listbox').first();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const optionByRole = listbox.getByRole('option', {
    name: new RegExp(`^${escapeRegExp(String(score))}$`),
  }).first();

  if (await optionByRole.count()) {
    await optionByRole.scrollIntoViewIfNeeded();
    await optionByRole.click();
    return;
  }

  const optionByText = listbox
    .getByText(new RegExp(`^${escapeRegExp(String(score))}$`), { exact: true })
    .first();

  await optionByText.scrollIntoViewIfNeeded();
  await optionByText.click();
}

async function setMatrixScore(page, criterionName, columnIndex, score) {
  const matrixSection = await getEvaluationMatrixSection(page);

  const row = matrixSection.locator('tbody tr').filter({
    has: page.getByText(criterionName, { exact: true }),
  }).first();

  await expect(row).toBeVisible({ timeout: 15000 });

  const cell = row.locator('td').nth(columnIndex + 1);
  const trigger = cell.locator('button').first();

  await expect(trigger).toBeVisible({ timeout: 15000 });
  await selectDropdownScore(page, trigger, score);

  await expect(trigger).toContainText(String(score), { timeout: 15000 });
}

async function verifyWeightedScores(page) {
  const matrixSection = await getEvaluationMatrixSection(page);
  const footerRow = matrixSection.locator('tfoot tr').first();

  await expect(footerRow).toBeVisible({ timeout: 15000 });

  const scoreCells = footerRow.locator('td');

  for (let i = 0; i < EXPECTED_WEIGHTED_SCORES.length; i++) {
    const expectedScore = EXPECTED_WEIGHTED_SCORES[i];
    const cell = scoreCells.nth(i + 1);
    await expect(cell).toContainText(expectedScore, { timeout: 15000 });
  }
}

test.describe.serial('Evaluation matrix scores flow', () => {
  test('01. Set all evaluation matrix scores', async ({ page }) => {
    await login(page);
    await openCompetitorsPage(page);

    for (const row of MATRIX_ROWS) {
      for (let i = 0; i < row.scores.length; i++) {
        await setMatrixScore(page, row.criterion, i, row.scores[i]);
      }
    }

    await verifyWeightedScores(page);
  });
});