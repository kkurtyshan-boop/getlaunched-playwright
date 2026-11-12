import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique } from './config';
import {
  createTeamMember,
  openTeamAndStaffTab,
  openEditModalForRole,
  fillEmploymentPercents,
  fteInputs,
  submitTeamRoleUpdate,
} from './helpers/team.helper';

// Self-contained: creates its own key member (and, for the line staff test,
// its own line staff record) via the helper instead of depending on
// 14-create-team-and-staff.spec.js having run first (see
// tests/07-edit-product-add-delete-client.spec.js for the same
// test.describe.serial + shared `let` pattern). Line staff setup lives
// inline in test 03 so a Line staff failure can't cascade-skip 01/02.
test.describe.serial('Edit team and staff flow', () => {
  let keyMember;

  test('00. Create a key member to edit', async ({ page, project }) => {
    await login(page);

    keyMember = await createTeamMember(page, project, { type: 'key', roleName: unique('Autotest Edit Role') });
  });

  test('01. Edit key member role name and salary', async ({ page, project }) => {
    await login(page);
    await openTeamAndStaffTab(page, project);

    const updatedRoleName = unique('Updated CMO Role');
    const previousRoleName = keyMember.roleName;

    const modal = await openEditModalForRole(page, keyMember.cardText);

    const roleNameField = modal.getByPlaceholder('Type role name').first();
    await expect(roleNameField).toBeVisible({ timeout: 15000 });
    await roleNameField.fill(updatedRoleName);

    const salaryField = modal.getByPlaceholder(/type salary/i).first();
    await expect(salaryField).toBeVisible({ timeout: 15000 });
    await salaryField.fill('110400');

    await submitTeamRoleUpdate(modal);

    await expect(page.getByText(updatedRoleName, { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(previousRoleName, { exact: true })).toHaveCount(0);

    // Persistence check: reload (Operations resets to its default tab on
    // reload) and confirm the renamed role stuck, not just an optimistic
    // client-side update.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.getByRole('tab', { name: /team and staff/i }).first().click();
    await expect(page.getByText(updatedRoleName, { exact: true }).first()).toBeVisible({ timeout: 15000 });

    keyMember.roleName = updatedRoleName;
  });

  test('02. Edit key member employment % and background', async ({ page, project }) => {
    await login(page);
    await openTeamAndStaffTab(page, project);

    const updatedBackground = unique('Now consults on a project basis');

    let modal = await openEditModalForRole(page, keyMember.cardText);
    await fillEmploymentPercents(modal, ['60']);

    const backgroundField = modal.getByPlaceholder('Write your story...').first();
    await expect(backgroundField).toBeVisible({ timeout: 15000 });
    await backgroundField.fill(updatedBackground);

    await submitTeamRoleUpdate(modal);

    // Persistence check: reopen the edit form and confirm the changes stuck
    // server-side.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.getByRole('tab', { name: /team and staff/i }).first().click();

    modal = await openEditModalForRole(page, keyMember.cardText);
    await expect(modal.getByPlaceholder('Write your story...').first()).toHaveValue(updatedBackground, { timeout: 15000 });
    await expect(modal.getByText('%', { exact: true }).first().locator('xpath=preceding-sibling::input[1]')).toHaveValue('60', { timeout: 15000 });
  });

  test('03. Edit line staff FTE per year and description', async ({ page, project }) => {
    test.setTimeout(90_000);
    await login(page);

    const lineStaff = await createTeamMember(page, project, { type: 'line', roleName: unique('Autotest Edit Line Staff') });

    // createTeamMember already leaves the Team and staff tab open — no
    // re-navigation needed before opening the edit modal.
    const updatedDescription = unique('Updated line staff description');

    let modal = await openEditModalForRole(page, lineStaff.cardText);

    const qtyInputs = fteInputs(modal);
    const qtyCount = await qtyInputs.count();
    const updatedQuantities = [];
    for (let i = 0; i < qtyCount; i++) {
      const value = ['2.5', '4'][i] ?? '4';
      updatedQuantities.push(value);
      await qtyInputs.nth(i).fill(value);
    }

    const descriptionField = modal.getByPlaceholder('Write your story...').first();
    await expect(descriptionField).toBeVisible({ timeout: 15000 });
    await descriptionField.fill(updatedDescription);

    await submitTeamRoleUpdate(modal);

    // Persistence check: reopen the edit form and confirm the quantities and
    // description actually stuck server-side.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.getByRole('tab', { name: /team and staff/i }).first().click();

    modal = await openEditModalForRole(page, lineStaff.cardText);
    await expect(modal.getByPlaceholder('Write your story...').first()).toHaveValue(updatedDescription, { timeout: 15000 });

    const reloadedQtyInputs = fteInputs(modal);
    for (let i = 0; i < updatedQuantities.length; i++) {
      await expect(reloadedQtyInputs.nth(i)).toHaveValue(updatedQuantities[i], { timeout: 15000 });
    }
  });
});
