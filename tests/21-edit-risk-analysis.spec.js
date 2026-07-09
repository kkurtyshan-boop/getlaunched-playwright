import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const UPDATED_TYPO_RISK_DESCRIPTION =
  'Internal risk: a labeling typo slipped past the first review pass and was only caught during final quality review before shipment.';

const UPDATED_CURRENCY_RISK_DESCRIPTION =
  'External risk: sustained EUR/USD volatility now materially raises the cost of imported raw materials and packaging components each quarter.';

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

async function openImplementationTab(page) {
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

  const implementationTab = page.getByRole('tab', { name: /^implementation$/i }).first();
  if (await implementationTab.isVisible().catch(() => false)) {
    await implementationTab.click();
  } else {
    const implementationLink = page.getByRole('link', { name: /^implementation$/i }).first();
    await expect(implementationLink).toBeVisible({ timeout: 15000 });
    await implementationLink.click();
  }

  await expect(
    page.getByRole('heading', { name: /implementation/i }).first()
  ).toBeVisible({ timeout: 15000 });
}

async function openEditModalForRisk(page, riskNameSubstring) {
  const row = page.locator('tr').filter({ hasText: riskNameSubstring }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.scrollIntoViewIfNeeded();

  const menuButton = row.getByRole('button', { name: /open actions menu/i }).first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

// Only touches the fields present in `changes`, leaving the rest of the
// pre-filled edit form untouched.
async function applyRiskEdits(modal, changes) {
  if (changes.name) {
    const field = modal.getByPlaceholder('Type risk name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.name);
  }

  if (changes.description) {
    const field = modal.getByPlaceholder('Write your story...').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.description);
  }

  if (changes.type) {
    const radio = modal.getByRole('radio', { name: new RegExp(`^${changes.type}$`, 'i') }).first();
    await expect(radio).toBeVisible({ timeout: 15000 });
    await radio.click();
  }

  if (changes.consequences) {
    const radio = modal
      .getByRole('radio', { name: new RegExp(`^${changes.consequences}$`, 'i') })
      .first();
    await expect(radio).toBeVisible({ timeout: 15000 });
    await radio.click();
  }

  if (changes.probability) {
    const radio = modal
      .getByRole('radio', { name: new RegExp(`^${changes.probability}$`, 'i') })
      .first();
    await expect(radio).toBeVisible({ timeout: 15000 });
    await radio.click();
  }
}

async function updateRisk(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();

  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
}

test.describe.serial('Edit risk analysis flow', () => {
  test('01. Edit an internal risk consequences and description', async ({ page }) => {
    await login(page);
    await openImplementationTab(page);

    const modal = await openEditModalForRisk(page, 'minor packaging label typo');

    await applyRiskEdits(modal, {
      consequences: 'Minor',
      description: UPDATED_TYPO_RISK_DESCRIPTION,
    });

    await updateRisk(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });

  test('02. Edit an external risk probability and description', async ({ page }) => {
    await login(page);
    await openImplementationTab(page);

    const modal = await openEditModalForRisk(page, 'currency fluctuation on imports');

    await applyRiskEdits(modal, {
      probability: 'Likely',
      description: UPDATED_CURRENCY_RISK_DESCRIPTION,
    });

    await updateRisk(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });

  test('03. Hovering a risk matrix marker shows a risk details tooltip', async ({ page }) => {
    await login(page);
    await openImplementationTab(page);

    // Risk matrix markers are truncated labels like "Internal…" / "External…"
    const marker = page.getByText(/^(Internal|External)…$/).first();
    await expect(marker).toBeVisible({ timeout: 15000 });
    await marker.hover();

    const tooltip = page.getByRole('tooltip').first();
    await expect(tooltip).toBeVisible({ timeout: 15000 });
    await expect(tooltip).toContainText(/consequences/i);
    await expect(tooltip).toContainText(/probability/i);
    await expect(tooltip).toContainText(/risk level/i);
  });
});
