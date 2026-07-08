import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const KEY_MEMBERS = [
  {
    firstName: 'Marie',
    lastName: 'Laurent',
    background:
      'Досвідчений маркетинг-директор з 12-річним досвідом у luxury-сегменті косметики та парфумерії.',
    roleName: 'Chief Marketing Officer',
    importancePercent: '90',
    employmentType: 'Full time',
    salary: '8500',
    period: 'Monthly',
    startYear: '2027',
  },
  {
    firstName: 'Julien',
    lastName: 'Moreau',
    background:
      'Керує розробкою нових ліній парфумів та косметики, від концепту до запуску.',
    roleName: 'Head of Product Development',
    importancePercent: '80',
    employmentType: 'Full time',
    salary: '7800',
    period: 'Monthly',
    startYear: '2027',
  },
  {
    firstName: 'Sophie',
    lastName: 'Bernard',
    background:
      'Відповідає за візуальну ідентичність бренду, рекламні кампанії та колаборації.',
    roleName: 'Creative Director',
    importancePercent: '75',
    employmentType: 'Freelance',
    salary: '120',
    period: 'Hourly',
    startYear: '2028',
  },
];

const LINE_STAFF = [
  {
    roleName: 'Boutique Sales Associate',
    quantities: ['8', '12'],
    importancePercent: '60',
    employmentType: 'Full time',
    salary: '22000',
    period: 'Annually',
    startYear: '2027',
    description:
      'Консультанти в бутиках Dior, що обслуговують клієнтів та здійснюють продажі.',
  },
  {
    roleName: 'Warehouse Operator',
    quantities: ['4', '6'],
    importancePercent: '40',
    employmentType: 'Part time',
    salary: '15000',
    period: 'Annually',
    startYear: '2027',
    description: 'Обробка та підготовка замовлень на складі.',
  },
  {
    roleName: 'Customer Support Specialist',
    quantities: ['3', '5'],
    importancePercent: '50',
    employmentType: 'Full time',
    salary: '18000',
    period: 'Annually',
    startYear: '2028',
    description:
      'Підтримка клієнтів через чат та телефон щодо замовлень і повернень.',
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

async function openCreateTeamRoleModal(page) {
  const createButton = page
    .getByRole('button', { name: /create team role/i })
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

async function createKeyMember(page, modal, member) {
  const firstNameField = modal.getByPlaceholder('Type first name').first();
  await expect(firstNameField).toBeVisible({ timeout: 15000 });
  await firstNameField.fill(member.firstName);

  const lastNameField = modal.getByPlaceholder('Type last name').first();
  await expect(lastNameField).toBeVisible({ timeout: 15000 });
  await lastNameField.fill(member.lastName);

  const backgroundField = modal.getByPlaceholder('Write your story...').first();
  await expect(backgroundField).toBeVisible({ timeout: 15000 });
  await backgroundField.fill(member.background);

  const roleNameField = modal.getByPlaceholder('Type role name').first();
  await expect(roleNameField).toBeVisible({ timeout: 15000 });
  await roleNameField.fill(member.roleName);

  const importanceField = modal.getByPlaceholder(/type engagement percent/i).first();
  await expect(importanceField).toBeVisible({ timeout: 15000 });
  await importanceField.fill(member.importancePercent);

  await selectFromCustomDropdown(page, modal, 0, member.employmentType);
  await page.waitForTimeout(200);

  const salaryField = modal.getByPlaceholder(/type salary/i).first();
  await expect(salaryField).toBeVisible({ timeout: 15000 });
  await salaryField.fill(member.salary);

  await selectFromCustomDropdown(page, modal, 1, member.period);
  await page.waitForTimeout(200);

  await selectFromCustomDropdown(page, modal, 2, member.startYear);
  await page.waitForTimeout(200);

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.locator('body')).toContainText(
    /created|success|saved|added/i,
    { timeout: 15000 }
  );
}

async function createLineStaff(page, modal, staff) {
  const lineStaffRadio = modal.getByRole('radio', { name: /line staff/i }).first();
  await expect(lineStaffRadio).toBeVisible({ timeout: 15000 });
  await lineStaffRadio.click();
  await page.waitForTimeout(300);

  const roleNameField = modal.getByPlaceholder('Type role name').first();
  await expect(roleNameField).toBeVisible({ timeout: 15000 });
  await roleNameField.fill(staff.roleName);

  const qtyInputs = modal.getByPlaceholder(/type quantity/i);
  const qtyCount = await qtyInputs.count();
  for (let i = 0; i < qtyCount; i++) {
    await qtyInputs.nth(i).fill(staff.quantities[i]);
  }

  const importanceField = modal.getByPlaceholder(/type engagement percent/i).first();
  await expect(importanceField).toBeVisible({ timeout: 15000 });
  await importanceField.fill(staff.importancePercent);

  await selectFromCustomDropdown(page, modal, 0, staff.employmentType);
  await page.waitForTimeout(200);

  const salaryField = modal.getByPlaceholder(/type salary/i).first();
  await expect(salaryField).toBeVisible({ timeout: 15000 });
  await salaryField.fill(staff.salary);

  await selectFromCustomDropdown(page, modal, 1, staff.period);
  await page.waitForTimeout(200);

  await selectFromCustomDropdown(page, modal, 2, staff.startYear);
  await page.waitForTimeout(200);

  const descriptionField = modal.getByPlaceholder('Write your story...').first();
  await expect(descriptionField).toBeVisible({ timeout: 15000 });
  await descriptionField.fill(staff.description);

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.locator('body')).toContainText(
    /created|success|saved|added/i,
    { timeout: 15000 }
  );
}

test.describe.serial('Team and staff flow', () => {
  test('01. Create key members', async ({ page }) => {
    // 3 key members created sequentially exceed the default 30s timeout
    test.setTimeout(120_000);

    await login(page);
    await openTeamAndStaffTab(page);

    for (const member of KEY_MEMBERS) {
      const modal = await openCreateTeamRoleModal(page);
      await createKeyMember(page, modal, member);
    }
  });

  test('02. Create line staff', async ({ page }) => {
    // 3 line staff roles created sequentially exceed the default 30s timeout
    test.setTimeout(120_000);

    await login(page);
    await openTeamAndStaffTab(page);

    for (const staff of LINE_STAFF) {
      const modal = await openCreateTeamRoleModal(page);
      await createLineStaff(page, modal, staff);
    }
  });
});
