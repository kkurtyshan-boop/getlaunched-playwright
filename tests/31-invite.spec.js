import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { openProject } from './helpers/navigation';

// Collaboration — Invite had zero spec coverage before this file. Only
// validation and the Cancel path are exercised here — actually inviting a
// real email is left uncovered since it would send a real email/create a
// pending collaborator on the shared live account with no easy teardown.

async function openInviteModal(page, project) {
  await openProject(page, project);
  await expect(page).toHaveURL(/\/dashboard/i, { timeout: 15000 });

  const inviteButton = page.getByRole('button', { name: /invite/i }).first();
  await expect(inviteButton).toBeVisible({ timeout: 15000 });
  await inviteButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

test.describe('Collaboration — Invite', () => {
  test('01. Role dropdown lists Editor and Viewer', async ({ page, project }) => {
    await login(page);
    const modal = await openInviteModal(page, project);

    const roleDropdown = modal.locator('button[data-open="false"]').first();
    await roleDropdown.click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 10000 });
    await expect(listbox.getByRole('option', { name: /^editor$/i })).toBeVisible();
    await expect(listbox.getByRole('option', { name: /^viewer$/i })).toBeVisible();
  });

  test('02. Submitting with an empty email is blocked', async ({ page, project }) => {
    await login(page);
    const modal = await openInviteModal(page, project);

    const inviteSubmitButton = modal.getByRole('button', { name: /^invite$/i }).first();
    await inviteSubmitButton.click();

    // The modal should still be open — nothing was sent for an empty form.
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('03. Malformed email is rejected', async ({ page, project }) => {
    await login(page);
    const modal = await openInviteModal(page, project);

    await modal.getByPlaceholder(/info@gmail\.com/i).fill('not-an-email');

    const roleDropdown = modal.locator('button[data-open="false"]').first();
    await roleDropdown.click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 10000 });
    await listbox.getByRole('option', { name: /^viewer$/i }).click();

    const inviteSubmitButton = modal.getByRole('button', { name: /^invite$/i }).first();
    await inviteSubmitButton.click();

    // Still open — a malformed email must not be accepted.
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('04. Cancel closes the modal without sending an invite', async ({ page, project }) => {
    await login(page);
    const modal = await openInviteModal(page, project);

    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });
});
