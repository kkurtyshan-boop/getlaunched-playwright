import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const UPDATED_MARIE_ROLE_NAME = 'Chief Marketing & Brand Officer';
const UPDATED_JULIEN_BACKGROUND =
  'Тепер консультує на проєктній основі: запуск нових ліній парфумів та косметики.';
const UPDATED_BOUTIQUE_DESCRIPTION =
  'Консультанти в бутиках Dior (розширена мережа), що обслуговують клієнтів та здійснюють продажі.';

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

async function openTeamAndStaffTab(page) {
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

  const teamTab = page.getByRole('tab', { name: /team and staff/i }).first();
  await expect(teamTab).toBeVisible({ timeout: 15000 });
  await teamTab.click();
}

async function openEditModalForCard(page, cardText) {
  const card = page.locator('li').filter({ hasText: cardText }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.scrollIntoViewIfNeeded();

  const menuButton = card.getByRole('button', { name: /open actions menu/i }).first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

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

// Only touches the fields present in `changes`, leaving the rest of the
// pre-filled edit form untouched.
async function applyKeyMemberEdits(page, modal, changes) {
  if (changes.firstName) {
    const field = modal.getByPlaceholder('Type first name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.firstName);
  }

  if (changes.lastName) {
    const field = modal.getByPlaceholder('Type last name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.lastName);
  }

  if (changes.background) {
    const field = modal.getByPlaceholder('Write your story...').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.background);
  }

  if (changes.roleName) {
    const field = modal.getByPlaceholder('Type role name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.roleName);
  }

  if (changes.importancePercent) {
    const field = modal.getByPlaceholder(/type engagement percent/i).first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.importancePercent);
  }

  if (changes.employmentType) {
    await selectFromCustomDropdown(page, modal, 0, changes.employmentType);
    await page.waitForTimeout(200);
  }

  if (changes.salary) {
    const field = modal.getByPlaceholder(/type salary/i).first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.salary);
  }

  if (changes.period) {
    await selectFromCustomDropdown(page, modal, 1, changes.period);
    await page.waitForTimeout(200);
  }

  if (changes.startYear) {
    await selectFromCustomDropdown(page, modal, 2, changes.startYear);
    await page.waitForTimeout(200);
  }
}

async function applyLineStaffEdits(page, modal, changes) {
  if (changes.roleName) {
    const field = modal.getByPlaceholder('Type role name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.roleName);
  }

  if (changes.quantities) {
    const qtyInputs = modal.getByPlaceholder(/type quantity/i);
    const qtyCount = await qtyInputs.count();
    for (let i = 0; i < qtyCount; i++) {
      await qtyInputs.nth(i).fill(changes.quantities[i]);
    }
  }

  if (changes.importancePercent) {
    const field = modal.getByPlaceholder(/type engagement percent/i).first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.importancePercent);
  }

  if (changes.employmentType) {
    await selectFromCustomDropdown(page, modal, 0, changes.employmentType);
    await page.waitForTimeout(200);
  }

  if (changes.salary) {
    const field = modal.getByPlaceholder(/type salary/i).first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.salary);
  }

  if (changes.period) {
    await selectFromCustomDropdown(page, modal, 1, changes.period);
    await page.waitForTimeout(200);
  }

  if (changes.startYear) {
    await selectFromCustomDropdown(page, modal, 2, changes.startYear);
    await page.waitForTimeout(200);
  }

  if (changes.description) {
    const field = modal.getByPlaceholder('Write your story...').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.description);
  }
}

async function updateTeamRole(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();

  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
}

test.describe.serial('Edit team and staff flow', () => {
  test('01. Edit key member role name and salary', async ({ page }) => {
    await login(page);
    await openTeamAndStaffTab(page);

    const modal = await openEditModalForCard(page, 'Marie Laurent');

    await applyKeyMemberEdits(page, modal, {
      roleName: UPDATED_MARIE_ROLE_NAME,
      salary: '9200',
    });

    await updateTeamRole(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(UPDATED_MARIE_ROLE_NAME, {
      timeout: 15000,
    });
  });

  test('02. Edit key member employment type and background', async ({ page }) => {
    await login(page);
    await openTeamAndStaffTab(page);

    const modal = await openEditModalForCard(page, 'Julien Moreau');

    await applyKeyMemberEdits(page, modal, {
      employmentType: 'Freelance',
      period: 'Hourly',
      salary: '150',
      background: UPDATED_JULIEN_BACKGROUND,
    });

    await updateTeamRole(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });

  test('03. Edit line staff quantities and description', async ({ page }) => {
    await login(page);
    await openTeamAndStaffTab(page);

    const modal = await openEditModalForCard(page, 'Boutique Sales Associate');

    await applyLineStaffEdits(page, modal, {
      quantities: ['10', '15'],
      description: UPDATED_BOUTIQUE_DESCRIPTION,
    });

    await updateTeamRole(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });
});
