import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const UPDATED_CATALOG_DESCRIPTION =
  'Add newly launched SKUs from the Spring collection to the internal and B2B product catalogs.';

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

async function openActionPlanTab(page) {
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

  const actionPlanTab = page.getByRole('tab', { name: /^action plan$/i }).first();
  await expect(actionPlanTab).toBeVisible({ timeout: 15000 });
  await actionPlanTab.click();
  await page.waitForTimeout(500);
}

async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel, exact = true) {
  const dropdownButton = scope.locator('button[data-open="false"]').nth(dropdownIndex);

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: optionLabel, exact }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
}

async function selectDueDate(page, modal, day) {
  const dueDateButton = modal.getByRole('button', { name: /select date/i }).first();
  await dueDateButton.click();
  await page.waitForTimeout(400);

  const dayButton = page.getByRole('button', { name: day, exact: true }).first();
  await expect(dayButton).toBeVisible({ timeout: 15000 });
  await dayButton.click();
  await page.waitForTimeout(300);
}

async function openEditModalForTask(page, taskName) {
  const cardContainer = page.getByRole('button', { name: new RegExp(taskName, 'i') }).first();
  await expect(cardContainer).toBeVisible({ timeout: 15000 });
  await cardContainer.scrollIntoViewIfNeeded();

  const menuButton = cardContainer.getByRole('button', { name: /open actions menu/i }).first();
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
// pre-filled edit form untouched. Dropdown positions: Priority(0), Stage(1), Assignee(2).
async function applyTaskEdits(page, modal, changes) {
  if (changes.name) {
    const field = modal.getByPlaceholder('Type name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.name);
  }

  if (changes.description) {
    const field = modal.getByPlaceholder('Write your story...').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.description);
  }

  if (changes.priority) {
    await selectFromCustomDropdown(page, modal, 0, changes.priority);
  }

  // Note: the Stage dropdown (index 1) in this form visually updates but does
  // not persist the change on Update — moving stages only works via drag-and-drop.

  if (changes.dueDateDay) {
    await selectDueDate(page, modal, changes.dueDateDay);
  }

  if (changes.assignee) {
    await selectFromCustomDropdown(page, modal, 2, changes.assignee, false);
  }
}

async function updateTask(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();

  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
}

test.describe.serial('Edit action plan flow', () => {
  test('01. Edit a minimal task: add due date, assignee, raise priority', async ({ page }) => {
    await login(page);
    await openActionPlanTab(page);

    const modal = await openEditModalForTask(page, 'Review Q3 marketing budget');

    await applyTaskEdits(page, modal, {
      priority: 'High',
      dueDateDay: '28',
      assignee: 'Julien Moreau',
    });

    await updateTask(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });

  test('02. Edit a task priority and add description', async ({ page }) => {
    await login(page);
    await openActionPlanTab(page);

    const modal = await openEditModalForTask(page, 'Update product catalog for new SKUs');

    await applyTaskEdits(page, modal, {
      priority: 'Critical',
      description: UPDATED_CATALOG_DESCRIPTION,
    });

    await updateTask(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });

  test('03. Edit a task priority and assignee', async ({ page }) => {
    await login(page);
    await openActionPlanTab(page);

    const modal = await openEditModalForTask(
      page,
      'Schedule supplier audit for Grasse Essence Co.'
    );

    await applyTaskEdits(page, modal, {
      priority: 'Critical',
      assignee: 'Sophie Bernard',
    });

    await updateTask(modal);

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/updated|success|saved/i, {
      timeout: 15000,
    });
  });
});
