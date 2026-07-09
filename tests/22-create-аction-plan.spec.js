import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const TASKS = [
  {
    // All fields filled
    name: 'Finalize packaging design for Spring collection',
    description:
      'Coordinate with the design team to finalize flacon and box artwork for the new spring perfume line.',
    priority: 'High',
    dueDateDay: '25',
    assignee: 'Sophie Bernard',
  },
  {
    // Only required fields (Name*, Priority*; Stage* defaults to the column)
    name: 'Review Q3 marketing budget',
    priority: 'Medium',
  },
  {
    name: 'Schedule supplier audit for Grasse Essence Co.',
    description:
      'Arrange an on-site quality and compliance audit with the fragrance raw materials supplier.',
    priority: 'High',
  },
  {
    name: 'Prepare investor update deck',
    priority: 'Critical',
    dueDateDay: '18',
    assignee: 'Marie Laurent',
  },
  {
    name: 'Update product catalog for new SKUs',
    priority: 'Low',
    assignee: 'Julien Moreau',
  },
  {
    name: 'Coordinate boutique staff training session',
    description:
      'Organize a training session for boutique associates on the new Spring collection.',
    priority: 'Medium',
    dueDateDay: '22',
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

async function addStage(page, stageName) {
  const addStageButton = page.getByRole('button', { name: /add stage/i }).first();
  await expect(addStageButton).toBeVisible({ timeout: 15000 });
  await addStageButton.click();
  await page.waitForTimeout(300);

  const stageNameInput = page.getByRole('textbox', { name: /stage name/i }).first();
  await expect(stageNameInput).toBeVisible({ timeout: 15000 });
  await stageNameInput.fill(stageName);

  const addButton = page.getByRole('button', { name: /^add$/i }).first();
  await expect(addButton).toBeEnabled({ timeout: 5000 });
  await addButton.click();
  await page.waitForTimeout(800);
}

function getColumnByStageName(page, stageName) {
  const heading = page.getByText(stageName, { exact: true }).first();
  // The whole column is the closest ancestor Card wrapper (header + card list),
  // not a fixed ancestor depth — that shifts once the column has items in it.
  return heading.locator('xpath=ancestor::*[@data-slot="card"]').first();
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

async function createTask(page, stageName, task) {
  const column = getColumnByStageName(page, stageName);
  const plusButton = column.getByRole('button').nth(2);
  await expect(plusButton).toBeVisible({ timeout: 15000 });
  await plusButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  const nameField = modal.getByPlaceholder('Type name').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(task.name);

  if (task.description) {
    const descField = modal.getByPlaceholder('Write your story...').first();
    await descField.fill(task.description);
  }

  await selectFromCustomDropdown(page, modal, 0, task.priority);

  // Stage (index 1) already defaults to the column this modal was opened from

  if (task.dueDateDay) {
    await selectDueDate(page, modal, task.dueDateDay);
  }

  if (task.assignee) {
    await selectFromCustomDropdown(page, modal, 2, task.assignee, false);
  }

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
}

// Native Playwright dragTo() does not trigger this board's drag-and-drop
// library — a manual mouse sequence with intermediate move steps is needed.
async function dragCardToColumn(page, cardText, targetStageName) {
  const card = page.getByText(cardText, { exact: false }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.scrollIntoViewIfNeeded();

  const targetColumn = getColumnByStageName(page, targetStageName);
  await targetColumn.scrollIntoViewIfNeeded();

  const cardBox = await card.boundingBox();
  const targetBox = await targetColumn.boundingBox();

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(150);
  await page.mouse.move(
    cardBox.x + cardBox.width / 2 + 15,
    cardBox.y + cardBox.height / 2 + 15,
    { steps: 5 }
  );
  await page.waitForTimeout(150);
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 20 }
  );
  await page.waitForTimeout(300);
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2 + 10,
    { steps: 5 }
  );
  await page.waitForTimeout(300);
  await page.mouse.up();
  await page.waitForTimeout(1000);
}

test.describe.serial('Action plan flow', () => {
  test('01. Create In Progress and Done stages', async ({ page }) => {
    await login(page);
    await openActionPlanTab(page);

    await addStage(page, 'In Progress');
    await addStage(page, 'Done');
  });

  test('02. Create action items with full, minimal, and mixed fields', async ({ page }) => {
    // 6 tasks created sequentially, several with a date picker — exceeds the default 30s timeout
    test.setTimeout(180_000);

    await login(page);
    await openActionPlanTab(page);

    for (const task of TASKS) {
      await createTask(page, 'To Do', task);
    }
  });

  test('03. Drag tasks to different stages and verify after reload', async ({ page }) => {
    test.setTimeout(60_000);

    await login(page);
    await openActionPlanTab(page);

    await dragCardToColumn(page, TASKS[0].name, 'In Progress');
    await dragCardToColumn(page, TASKS[3].name, 'Done');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const inProgressColumn = getColumnByStageName(page, 'In Progress');
    await expect(inProgressColumn).toContainText(TASKS[0].name, { timeout: 15000 });

    const doneColumn = getColumnByStageName(page, 'Done');
    await expect(doneColumn).toContainText(TASKS[3].name, { timeout: 15000 });
  });
});
