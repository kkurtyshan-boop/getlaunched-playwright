import { expect } from '@playwright/test';
import { gotoOperations } from './navigation';
import { TEAM_MEMBER_NAME, unique } from '../config';

// Operations renders Marketing channels / Team and staff / Resources / Other
// as tabs on one page (see PROJECT_KNOWLEDGE.md §3.3) — navigate via the
// `project` fixture + gotoOperations, then click into this specific tab.
export async function openTeamAndStaffTab(page, project) {
  await gotoOperations(page, project);

  const teamTab = page.getByRole('tab', { name: /team and staff/i }).first();
  await expect(teamTab).toBeVisible({ timeout: 15000 });
  await teamTab.click();
}

export async function openCreateTeamRoleModal(page) {
  const createButton = page.getByRole('button', { name: /create team role/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

export async function getTeamRoleCard(page, cardText) {
  const card = page.locator('li').filter({ hasText: cardText }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  return card;
}

export async function openEditModalForRole(page, cardText) {
  const card = await getTeamRoleCard(page, cardText);
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

// Key member "Employment*" section: one whole-number % input per
// planning-horizon year. The inputs have no placeholder/accessible name, so
// anchor on each row's "%" label and take its preceding input.
function employmentPercentInputs(modal) {
  return modal.getByText('%', { exact: true }).locator('xpath=preceding-sibling::input[1]');
}

export async function fillEmploymentPercents(modal, percents) {
  const inputs = employmentPercentInputs(modal);
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).fill(percents[i] ?? percents[percents.length - 1]);
  }
}

// Line staff "FTE per year*": one input per planning-horizon year
// (placeholder still "Type quantity"); decimals allowed, ≥ 0, at least one
// year > 0 (1 = one full-time person, 0.5 = half-time).
export function fteInputs(modal) {
  return modal.getByPlaceholder(/type quantity/i);
}

export async function submitTeamRoleUpdate(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();

  // The modal closing is a far more specific success signal than a loose
  // body-text match (lesson 2) — the list already contains words like
  // "updated"/"saved" in unrelated copy.
  await expect(modal).not.toBeVisible({ timeout: 15000 });
}

// Creates one Team and staff record via the real "Create team role" modal
// and returns the fixture used (plus `cardText`, the substring that
// identifies its card in the combined list: "First Last" for a Key member,
// the role name for Line staff).
//
// Form shapes (confirmed live 2026-11-11; Employment type / Pay period /
// Engagement % are gone):
//   Key member — first/last name, background, role name, Salary per year,
//                Employment % per year (whole numbers)
//   Line staff — role name, FTE per year, Salary per year, description
//
// overrides.type: 'key' (default) | 'line'.
export async function createTeamMember(page, project, overrides = {}) {
  const type = overrides.type || 'key';

  await openTeamAndStaffTab(page, project);
  const modal = await openCreateTeamRoleModal(page);

  const member = {
    type,
    firstName: overrides.firstName || 'QA',
    lastName: overrides.lastName || unique(TEAM_MEMBER_NAME),
    roleName: overrides.roleName || unique(`${TEAM_MEMBER_NAME} Role`),
    background: overrides.background || 'Key member created by the automated test suite.',
    description: overrides.description || 'Line staff role created by the automated test suite.',
    salary: overrides.salary || '60000',
    employmentPercents: overrides.employmentPercents || ['100'],
    fte: overrides.fte || ['1', '1.5'],
  };

  if (type === 'line') {
    await modal.getByRole('radio', { name: /line staff/i }).first().click();

    await modal.getByPlaceholder('Type role name').first().fill(member.roleName);

    const inputs = fteInputs(modal);
    await expect(inputs.first()).toBeVisible({ timeout: 15000 });
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).fill(member.fte[i] ?? member.fte[member.fte.length - 1]);
    }

    await modal.getByPlaceholder(/type salary/i).first().fill(member.salary);
    await modal.getByPlaceholder('Write your story...').first().fill(member.description);
  } else {
    const keyMemberRadio = modal.getByRole('radio', { name: /key member/i }).first();
    if (await keyMemberRadio.isVisible().catch(() => false)) {
      await keyMemberRadio.click();
    }

    const firstNameField = modal.getByPlaceholder('Type first name').first();
    await expect(firstNameField).toBeVisible({ timeout: 15000 });
    await firstNameField.fill(member.firstName);
    await modal.getByPlaceholder('Type last name').first().fill(member.lastName);
    await modal.getByPlaceholder('Write your story...').first().fill(member.background);
    await modal.getByPlaceholder('Type role name').first().fill(member.roleName);
    await modal.getByPlaceholder(/type salary/i).first().fill(member.salary);
    await fillEmploymentPercents(modal, member.employmentPercents);
  }

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await expect(modal).not.toBeVisible({ timeout: 15000 });

  member.cardText = type === 'line' ? member.roleName : `${member.firstName} ${member.lastName}`;

  return member;
}
