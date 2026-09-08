import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { TASK_NAME, unique } from './config';
import {
  gotoActionPlanBoard,
  createStage,
  createTask,
  dragCardToColumn,
  createKeyMemberForAssignee,
  getColumnByStageName,
} from './helpers/action-plan.helper';

// Self-contained: creates its own Key Member (Assignee source), its own
// extra stages, and its own uniquely-named tasks every run instead of
// depending on fixed board state — see data-hygiene note in CLAUDE.md
// (create flows are not idempotent, no teardown, live shared project).
test.describe.serial('Action plan flow', () => {
  let inProgressStage;
  let doneStage;
  let member;
  let tasks;

  test('00. Set up a Key Member to use as task assignee', async ({ page, project }) => {
    await login(page);
    member = await createKeyMemberForAssignee(page, project);
  });

  test('01. Create In Progress and Done stages', async ({ page, project }) => {
    await login(page);

    inProgressStage = (await createStage(page, project, { name: unique('In Progress') })).name;
    doneStage = (await createStage(page, project, { name: unique('Done') })).name;
  });

  test('02. Create action items with full, minimal, and mixed fields', async ({ page, project }) => {
    // 6 tasks created sequentially, several with a date picker — exceeds the default 30s timeout
    test.setTimeout(180_000);

    await login(page);

    tasks = [
      {
        // All fields filled
        name: unique(TASK_NAME),
        description: 'Full-fields autotest task exercising every optional field at once.',
        priority: 'High',
        dueDateDay: '25',
        assignee: member.fullName,
      },
      {
        // Only required fields (Name*, Priority*; Stage* defaults to the column)
        name: unique(TASK_NAME),
        priority: 'Medium',
      },
      {
        name: unique(TASK_NAME),
        description: 'Autotest task with a description but no due date or assignee.',
        priority: 'High',
      },
      {
        name: unique(TASK_NAME),
        priority: 'Critical',
        dueDateDay: '18',
        assignee: member.fullName,
      },
      {
        name: unique(TASK_NAME),
        priority: 'Low',
        assignee: member.fullName,
      },
      {
        name: unique(TASK_NAME),
        description: 'Autotest task with a description and a due date, no assignee.',
        priority: 'Medium',
        dueDateDay: '22',
      },
    ];

    for (const task of tasks) {
      await createTask(page, project, 'To Do', task);
    }
  });

  test('03. Drag tasks to different stages and verify after reload', async ({ page, project }) => {
    test.setTimeout(60_000);

    await login(page);
    await gotoActionPlanBoard(page, project);

    await dragCardToColumn(page, tasks[0].name, inProgressStage);
    await dragCardToColumn(page, tasks[3].name, doneStage);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const inProgressColumn = getColumnByStageName(page, inProgressStage);
    await expect(inProgressColumn).toContainText(tasks[0].name, { timeout: 15000 });

    const doneColumn = getColumnByStageName(page, doneStage);
    await expect(doneColumn).toContainText(tasks[3].name, { timeout: 15000 });
  });
});
