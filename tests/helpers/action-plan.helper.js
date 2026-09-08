import { expect } from '@playwright/test';
import { gotoImplementation, gotoOperations } from './navigation';
import { STAGE_NAME, TASK_NAME, CALC_START_YEAR, unique } from '../config';

// Implementation → Action plan is a tabbed page (Risk analysis / Action
// plan / MVP) reached via the `project` fixture + gotoImplementation, then
// clicking the "Action plan" tab — see PROJECT_KNOWLEDGE.md §3.5.
export async function gotoActionPlanBoard(page, project) {
  await gotoImplementation(page, project);

  const actionPlanTab = page.getByRole('tab', { name: /^action plan$/i }).first();
  await expect(actionPlanTab).toBeVisible({ timeout: 15000 });
  await actionPlanTab.click();

  const addStageButton = page.getByRole('button', { name: /add stage/i }).first();
  await expect(addStageButton).toBeVisible({ timeout: 15000 });
}

// The whole column is the closest ancestor Card wrapper (header + card
// list), not a fixed ancestor depth — that shifts once the column has items
// in it.
export function getColumnByStageName(page, stageName) {
  const heading = page.getByText(stageName, { exact: true }).first();
  return heading.locator('xpath=ancestor::*[@data-slot="card"]').first();
}

// Custom dropdowns follow ONE pattern app-wide: button[data-open="false"] ->
// listbox -> option. `fallbackToFirst` is for option sets that can be
// virtualized/scrolled so the exact preferred label may not be in the DOM
// (e.g. a long Start year list) — pick whatever option IS rendered instead
// of failing outright.
export async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel, exact = true, fallbackToFirst = false) {
  const dropdownButton = scope.locator('button[data-open="false"]').nth(dropdownIndex);

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const preferredOption = listbox.getByRole('option', { name: optionLabel, exact });
  const anyOption = listbox.getByRole('option');

  let option = preferredOption.first();
  if (fallbackToFirst) {
    await expect(anyOption.first()).toBeVisible({ timeout: 15000 });
    option = (await preferredOption.count()) > 0 ? preferredOption.first() : anyOption.first();
  } else if ((await preferredOption.count()) === 0) {
    // On a board that's accumulated many stages/options across repeated
    // runs, the target option can be scrolled out of the listbox's own
    // rendered window — nudge the listbox's internal scroll and re-check
    // (bounded) before giving up, rather than assuming it's simply absent.
    for (let i = 0; i < 20 && (await preferredOption.count()) === 0; i++) {
      await listbox.evaluate((el) => { el.scrollTop += 200; }).catch(() => {});
      await page.waitForTimeout(100);
    }
  }

  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});
}

// `day` is a preference, not a guarantee: the calendar opens to the month of
// whatever due date is already set, and this picker disables past dates
// entirely. Clicks "Next month" until at least one day is selectable, then
// prefers `day` if it's enabled in that view, otherwise takes the first
// enabled day.
export async function selectDueDate(page, modal, day) {
  const dueDateButton = modal
    .getByRole('button', { name: /select date|^\d{1,2}\s+\p{L}+\s+\d{4}$/iu })
    .first();
  await dueDateButton.click();

  const popover = page.getByRole('dialog').last();
  await expect(popover).toBeVisible({ timeout: 15000 });
  const nextMonthButton = popover.getByRole('button', { name: /next month/i });

  let anyEnabledDay = popover.getByRole('button', { name: /^\d{1,2}$/, disabled: false });
  for (let attempts = 0; (await anyEnabledDay.count()) === 0 && attempts < 6; attempts++) {
    await nextMonthButton.click();
    anyEnabledDay = popover.getByRole('button', { name: /^\d{1,2}$/, disabled: false });
  }
  await expect(anyEnabledDay.first()).toBeVisible({ timeout: 15000 });

  const preferredDay = day
    ? popover.getByRole('button', { name: day, exact: true, disabled: false })
    : anyEnabledDay;
  const dayButton = day && (await preferredDay.count()) > 0 ? preferredDay.first() : anyEnabledDay.first();

  await dayButton.click();
  await expect(popover).not.toBeVisible({ timeout: 5000 }).catch(() => {});
}

// Creates a new Kanban column via "Add Stage" (name required) and returns
// the fixture used, so callers can act on it without depending on another
// spec having run first.
export async function createStage(page, project, overrides = {}) {
  const stage = { name: overrides.name || unique(STAGE_NAME) };

  await gotoActionPlanBoard(page, project);

  const addStageButton = page.getByRole('button', { name: /add stage/i }).first();
  await expect(addStageButton).toBeVisible({ timeout: 15000 });
  await addStageButton.click();

  const stageNameInput = page.getByRole('textbox', { name: /stage name/i }).first();
  await expect(stageNameInput).toBeVisible({ timeout: 15000 });
  await stageNameInput.fill(stage.name);

  const addButton = page.getByRole('button', { name: /^add$/i }).first();
  await expect(addButton).toBeEnabled({ timeout: 5000 });
  await addButton.click();

  const column = getColumnByStageName(page, stage.name);
  await expect(column).toBeVisible({ timeout: 15000 });

  return stage;
}

// Creates a task in `stageName`'s column via that column's "+" button (3rd
// icon button in the column header). Assignee/dueDateDay are optional —
// Priority is the only other required field besides Name.
export async function createTask(page, project, stageName, overrides = {}) {
  const task = {
    name: overrides.name || unique(TASK_NAME),
    description: overrides.description,
    priority: overrides.priority || 'Medium',
    dueDateDay: overrides.dueDateDay,
    assignee: overrides.assignee,
  };

  await gotoActionPlanBoard(page, project);

  const column = getColumnByStageName(page, stageName);
  await expect(column).toBeVisible({ timeout: 15000 });
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

  // Stage (index 1) already defaults to the column this modal was opened from.

  if (task.dueDateDay) {
    await selectDueDate(page, modal, task.dueDateDay);
  }

  if (task.assignee) {
    await selectFromCustomDropdown(page, modal, 2, task.assignee, false);
  }

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();
  await expect(modal).not.toBeVisible({ timeout: 15000 });

  const stageColumn = getColumnByStageName(page, stageName);
  await expect(stageColumn).toContainText(task.name, { timeout: 15000 });

  return task;
}

// Walks up from `locator` to the nearest ancestor that actually scrolls
// horizontally (scrollWidth > clientWidth) — the Kanban strip's scroll
// container — without hardcoding its class name (Tailwind utility classes
// on it aren't a stable selector). Returns an ElementHandle or null.
async function findHorizontalScrollAncestor(locator) {
  const handle = await locator.elementHandle();
  if (!handle) return null;
  const ancestor = await handle.evaluateHandle((el) => {
    let node = el;
    while (node && node.scrollWidth <= node.clientWidth + 2) {
      node = node.parentElement;
    }
    return node;
  });
  const element = await ancestor.asElement();
  if (!element) {
    await ancestor.dispose();
    return null;
  }
  return element;
}

// CONFIRMED (see BUG_PATTERNS.md "Action Plan Board Ignores Playwright's
// Native dragTo()"): native locator.dragTo() is a silent no-op on this
// board. Core sequence (mouse.down -> stepped mouse.move -> pause -> final
// mouse.move -> mouse.up) ported from the manual sequence originally in
// tests/22-create-action-plan.spec.js — do not "modernize" this to dragTo().
//
// One change from that original: it called scrollIntoViewIfNeeded() on the
// source card AND the target column before computing either bounding box.
// Both cards and columns live in the SAME horizontally-scrolling Kanban
// strip, so scrolling the target into view can push the just-scrolled
// source card back out of the viewport — that only stayed invisible while
// this shared "Autotest Project" board had few enough stages to fit one
// screen. Since this suite adds new stages every run (see createStage) and
// the live project accumulates stages across every run of every agent that
// touches it, the strip's scroll distance is unbounded and grows over time
// — an edge-hover-and-wait auto-scroll (tried first) has no reliable
// attempts/timeout budget that stays correct as the board keeps growing.
// Instead, once the drag is active, this jumps the strip's own scrollLeft
// directly (via the scroll container located by
// findHorizontalScrollAncestor) to bring the target column fully into view,
// then re-issues a real mouse.move at its new on-screen position — the
// library's hit-testing only cares about the pointer's current viewport
// coordinate, not how the content got there.
export async function dragCardToColumn(page, cardLocatorOrName, targetColumnName) {
  const card = typeof cardLocatorOrName === 'string'
    ? page.getByText(cardLocatorOrName, { exact: false }).first()
    : cardLocatorOrName;
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.scrollIntoViewIfNeeded();

  // Resolve the scroll container from the CARD, not the target column: the
  // card is already attached/visible, but on a board that has accumulated
  // many stages across repeated runs, a column far to the right may not be
  // mounted in the DOM at all yet (confirmed live — a freshly-created
  // column's heading was simply absent from the page snapshot until
  // scrolled near it), so resolving an ancestor/elementHandle from it can
  // hang until timeout.
  const scrollContainer = await findHorizontalScrollAncestor(card);

  const cardBox = await card.boundingBox();

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(150);
  await page.mouse.move(
    cardBox.x + cardBox.width / 2 + 15,
    cardBox.y + cardBox.height / 2 + 15,
    { steps: 5 }
  );
  await page.waitForTimeout(150);

  // Nudge the strip in small increments, polling for the target column's
  // heading to actually mount, instead of computing one direct jump to its
  // rect up front (impossible before it exists in the DOM at all).
  if (scrollContainer) {
    const targetHeading = page.getByText(targetColumnName, { exact: true }).first();
    for (let i = 0; i < 80; i++) {
      if ((await targetHeading.count()) > 0) break;
      await page.evaluate((container) => {
        container.scrollLeft = Math.min(container.scrollLeft + 400, container.scrollWidth - container.clientWidth);
      }, scrollContainer);
      await page.waitForTimeout(120);
    }

    // Now that it exists, center it precisely.
    const targetHandle = await targetHeading.elementHandle().catch(() => null);
    if (targetHandle) {
      await page.evaluate(([container, target]) => {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const desiredScrollLeft =
          container.scrollLeft +
          (targetRect.left - containerRect.left) -
          (containerRect.width - targetRect.width) / 2;
        container.scrollLeft = Math.max(
          0,
          Math.min(desiredScrollLeft, container.scrollWidth - container.clientWidth)
        );
      }, [scrollContainer, targetHandle]);
      await page.waitForTimeout(200);
    }
  }

  const targetColumn = getColumnByStageName(page, targetColumnName);
  await expect(targetColumn).toBeVisible({ timeout: 10000 });
  const targetBox = await targetColumn.boundingBox();
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

// A task's Assignee dropdown is sourced from Team & Staff Key Members (NOT
// Line Staff) — see PROJECT_KNOWLEDGE.md §3.3/§3.4. This duplicates the
// minimal "Create team role" -> Key member -> First/Last/Role name -> submit
// steps inline, deliberately NOT importing a team.helper.js another agent
// may be building in parallel (avoids a cross-agent file race); a little
// duplication here is fine and keeps this spec pair independent.
export async function createKeyMemberForAssignee(page, project, overrides = {}) {
  const member = {
    firstName: overrides.firstName || 'Autotest',
    lastName: overrides.lastName || unique('Member'),
    roleName: overrides.roleName || unique('Autotest Assignee Role'),
    employmentType: overrides.employmentType || 'Full time',
    salary: overrides.salary || '1000',
    payPeriod: overrides.payPeriod || 'Monthly',
    startYear: overrides.startYear || CALC_START_YEAR,
  };

  await gotoOperations(page, project);

  const teamTab = page.getByRole('tab', { name: /team and staff/i }).first();
  await expect(teamTab).toBeVisible({ timeout: 15000 });
  await teamTab.click();

  const createRoleButton = page.getByRole('button', { name: /create team role/i }).first();
  await expect(createRoleButton).toBeVisible({ timeout: 15000 });
  await createRoleButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  // "Key member" is the default radio selection on a fresh modal, but click
  // it explicitly so this helper doesn't depend on that default holding.
  const keyMemberRadio = modal.getByRole('radio', { name: /key member/i }).first();
  if (await keyMemberRadio.isVisible().catch(() => false)) {
    await keyMemberRadio.click();
  }

  const firstNameField = modal.getByPlaceholder('Type first name').first();
  await expect(firstNameField).toBeVisible({ timeout: 15000 });
  await firstNameField.fill(member.firstName);

  const lastNameField = modal.getByPlaceholder('Type last name').first();
  await expect(lastNameField).toBeVisible({ timeout: 15000 });
  await lastNameField.fill(member.lastName);

  const roleNameField = modal.getByPlaceholder('Type role name').first();
  await expect(roleNameField).toBeVisible({ timeout: 15000 });
  await roleNameField.fill(member.roleName);

  // Confirmed live (2026-08-27) on a different environment/account: the
  // Employment type / Pay period / Start year dropdowns and the flat
  // "Engagement %" field are gone, replaced by one "Employment*" section
  // with a per-planning-horizon-year percentage input (no
  // placeholder/accessible name, unlike every other field in this form —
  // matched by that absence). Falls back to the old dropdown-based shape if
  // it's still present (see tests/helpers/team.helper.js's createTeamMember
  // for the same defensive fallback).
  const hasOldDropdowns = await modal.locator('button[data-open="false"]').first().isVisible().catch(() => false);
  if (hasOldDropdowns) {
    await selectFromCustomDropdown(page, modal, 0, member.employmentType);
  }

  const salaryField = modal.getByPlaceholder(/type salary/i).first();
  await expect(salaryField).toBeVisible({ timeout: 15000 });
  await salaryField.fill(member.salary);

  if (hasOldDropdowns) {
    await selectFromCustomDropdown(page, modal, 1, member.payPeriod);
    await selectFromCustomDropdown(page, modal, 2, member.startYear, true, true);
  } else {
    // Each per-year row renders as [year label, input, "%" label] siblings
    // with no placeholder/accessible name on the input itself — anchor on
    // the "%" label (an exact, unambiguous leaf) and take its immediate
    // preceding-sibling input (see team.helper.js's createTeamMember for
    // the same fix and why a fixed-ancestor-depth guess didn't work).
    const employmentInputs = modal.getByText('%', { exact: true }).locator('xpath=preceding-sibling::input[1]');
    const employmentCount = await employmentInputs.count();
    for (let i = 0; i < employmentCount; i++) {
      await employmentInputs.nth(i).fill('50');
    }
  }

  const submitButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(submitButton).toBeVisible({ timeout: 15000 });
  await submitButton.click();
  await expect(modal).not.toBeVisible({ timeout: 15000 });

  return {
    ...member,
    fullName: `${member.firstName} ${member.lastName}`,
  };
}
