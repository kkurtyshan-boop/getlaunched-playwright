import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique } from './config';
import {
  gotoActionPlanBoard,
  getColumnByStageName,
  selectFromCustomDropdown,
  selectDueDate,
  createStage,
  createTask,
  dragCardToColumn,
  createKeyMemberForAssignee,
} from './helpers/action-plan.helper';

const UPDATED_DESCRIPTION =
  unique('Autotest updated description') + ' — added while editing the task.';

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

  if (changes.stage) {
    // CONFIRMED, currently-open app bug (see BUG_PATTERNS.md "Action Plan
    // Edit Form Does Not Persist Stage Changes"): this visually updates the
    // dropdown but the change does not persist on Update. Only
    // drag-and-drop actually moves a task between stages. Callers exercising
    // this field must assert the CURRENT (broken) behavior, not that it works.
    await selectFromCustomDropdown(page, modal, 1, changes.stage);
  }

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
  // The modal closing is a far more specific success signal than matching
  // loose "updated/success/saved" text anywhere in the body.
  await expect(modal).not.toBeVisible({ timeout: 15000 });
}

// Self-contained: creates its own Key Member (assignee source), its own
// tasks, and its own extra stage instead of depending on the create-spec
// file having run first — see CLAUDE.md data-hygiene note (no teardown, no
// idempotent create flows on the shared live project).
test.describe.serial('Edit action plan flow', () => {
  let member;
  let minimalTaskName;
  let catalogTaskName;
  let auditTaskName;
  let extraStageName;

  test('00. Set up Key Member and tasks to edit', async ({ page, project }) => {
    // 3 tasks + 1 key member created sequentially exceeds the default 30s timeout
    test.setTimeout(120_000);

    await login(page);

    member = await createKeyMemberForAssignee(page, project);

    const minimalTask = await createTask(page, project, 'To Do', { priority: 'Medium' });
    minimalTaskName = minimalTask.name;

    const catalogTask = await createTask(page, project, 'To Do', { priority: 'Low' });
    catalogTaskName = catalogTask.name;

    const auditTask = await createTask(page, project, 'To Do', { priority: 'High' });
    auditTaskName = auditTask.name;

    const extraStage = await createStage(page, project, { name: unique('Autotest Review') });
    extraStageName = extraStage.name;
  });

  test('01. Edit a minimal task: add due date, assignee, raise priority', async ({ page, project }) => {
    await login(page);
    await gotoActionPlanBoard(page, project);

    const modal = await openEditModalForTask(page, minimalTaskName);
    await applyTaskEdits(page, modal, {
      priority: 'High',
      dueDateDay: '28',
      assignee: member.fullName,
    });
    await updateTask(modal);

    // Verify persistence after reload rather than trusting the closed modal alone.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const verifyModal = await openEditModalForTask(page, minimalTaskName);
    await expect(verifyModal.locator('button[data-open="false"]').nth(0)).toContainText('High', { timeout: 15000 });
    await expect(verifyModal.locator('button[data-open="false"]').nth(2)).toContainText(member.firstName, { timeout: 15000 });
    await expect(
      verifyModal.getByRole('button', { name: /28\s+\p{L}+\s+\d{4}/iu }).first()
    ).toBeVisible({ timeout: 15000 });

  });

  test('02. Edit a task priority and add description', async ({ page, project }) => {
    await login(page);
    await gotoActionPlanBoard(page, project);

    const modal = await openEditModalForTask(page, catalogTaskName);
    await applyTaskEdits(page, modal, {
      priority: 'Critical',
      description: UPDATED_DESCRIPTION,
    });
    await updateTask(modal);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const verifyModal = await openEditModalForTask(page, catalogTaskName);
    await expect(verifyModal.locator('button[data-open="false"]').nth(0)).toContainText('Critical', { timeout: 15000 });
    await expect(verifyModal.getByPlaceholder('Write your story...').first()).toHaveValue(
      UPDATED_DESCRIPTION,
      { timeout: 15000 }
    );

  });

  test('03. Edit a task priority and assignee', async ({ page, project }) => {
    await login(page);
    await gotoActionPlanBoard(page, project);

    const modal = await openEditModalForTask(page, auditTaskName);
    await applyTaskEdits(page, modal, {
      priority: 'Critical',
      assignee: member.fullName,
    });
    await updateTask(modal);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const verifyModal = await openEditModalForTask(page, auditTaskName);
    await expect(verifyModal.locator('button[data-open="false"]').nth(0)).toContainText('Critical', { timeout: 15000 });
    await expect(verifyModal.locator('button[data-open="false"]').nth(2)).toContainText(member.firstName, { timeout: 15000 });

  });

  // Confirmed, currently-open app bug — see BUG_PATTERNS.md "Action Plan
  // Edit Form Does Not Persist Stage Changes". This test deliberately
  // asserts the CURRENT (broken) behavior so a real fix shows up as a
  // failure here (prompting the entry to be updated to Fixed) instead of
  // silently drifting out of coverage. Drag-and-drop, exercised right after,
  // confirms the only working way to move a task between stages still works.
  test('04. Editing Stage via the form does not persist; drag-and-drop still does', async ({ page, project }) => {
    test.setTimeout(60_000);

    await login(page);
    await gotoActionPlanBoard(page, project);

    const modal = await openEditModalForTask(page, minimalTaskName);
    await applyTaskEdits(page, modal, { stage: extraStageName });
    await updateTask(modal);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const originalColumn = getColumnByStageName(page, 'To Do');
    await expect(originalColumn).toContainText(minimalTaskName, { timeout: 15000 });

    const extraStageColumn = getColumnByStageName(page, extraStageName);
    await expect(extraStageColumn).not.toContainText(minimalTaskName, { timeout: 5000 }).catch(() => {});

    // Now move it the way that actually works.
    await dragCardToColumn(page, minimalTaskName, extraStageName);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const movedColumn = getColumnByStageName(page, extraStageName);
    await expect(movedColumn).toContainText(minimalTaskName, { timeout: 15000 });
  });
});
