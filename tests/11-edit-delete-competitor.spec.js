import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';
const ORIGINAL_COMPETITOR_NAME = 'Champ Tea (champtea.ch)';
const UPDATED_COMPETITOR_NAME = 'Champ Tea';

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

async function getCompetitorRow(page, competitorName) {
  const safeName = escapeRegExp(competitorName);

  const competitorsSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: /competitors/i }),
  }).first();

  await expect(competitorsSection).toBeVisible({ timeout: 15000 });

  const row = competitorsSection
    .locator('li')
    .filter({
      has: page.getByRole('heading', { name: new RegExp(`^${safeName}$`, 'i') }),
    })
    .first();

  if (await row.count()) {
    await expect(row).toBeVisible({ timeout: 15000 });
    return row;
  }

  const fallbackRow = competitorsSection
    .locator('li')
    .filter({
      has: page.getByText(new RegExp(`^${safeName}$`, 'i')),
    })
    .first();

  await expect(fallbackRow).toBeVisible({ timeout: 15000 });
  return fallbackRow;
}

async function openRowActionsMenu(page, competitorName) {
  const row = await getCompetitorRow(page, competitorName);

  const menuButton = row
    .locator('button[aria-label="Open actions menu"]')
    .first();

  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  return row;
}

async function editCompetitorName(page, competitorName, updatedName) {
  await openRowActionsMenu(page, competitorName);

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  const nameInput = modal.locator('input').first();
  await expect(nameInput).toBeVisible({ timeout: 15000 });
  await nameInput.fill(updatedName);

  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();

  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('body')).toContainText(updatedName, {
    timeout: 15000,
  });
}

async function deleteCompetitor(page, competitorName) {
  await openRowActionsMenu(page, competitorName);

  const deleteItem = page.getByRole('menuitem', { name: /^delete$/i }).first();
  await expect(deleteItem).toBeVisible({ timeout: 15000 });
  await deleteItem.click();

  const confirmDeleteButton = page.getByRole('button', {
    name: /yes, delete this competitor/i,
  });

  await expect(confirmDeleteButton).toBeVisible({ timeout: 15000 });
  await confirmDeleteButton.click();

  await expect(page.getByText(/item deleted successfully/i)).toBeVisible({
    timeout: 15000,
  });

  const competitorsSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: /competitors/i }),
  }).first();

  await expect(
    competitorsSection.locator(`h3[title="${competitorName}"]`)
  ).toHaveCount(0, { timeout: 15000 });

  console.log(`✅ Competitor "${competitorName}" deleted successfully`);
}

test.describe.serial('Competitors edit and delete flow', () => {
  test('01. Edit competitor and then delete it', async ({ page }) => {
    await login(page);
    await openCompetitorsPage(page);

    await editCompetitorName(
      page,
      ORIGINAL_COMPETITOR_NAME,
      UPDATED_COMPETITOR_NAME
    );

    await deleteCompetitor(page, UPDATED_COMPETITOR_NAME);

    console.log('✅ TEST PASSED: edit and delete competitor flow completed');
  });
});