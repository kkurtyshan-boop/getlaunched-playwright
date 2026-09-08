import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, CLIENT_NAME } from './config';
import { createClient } from './helpers/client.helper';
import { gotoClients } from './helpers/navigation';

// Self-contained: creates its own client (with a need to delete) instead of
// depending on 04-create-client.spec.js having run first.
test('Edit client and delete a need', async ({ page, project }) => {
  await login(page);

  const client = await createClient(page, project, {
    name: unique(`${CLIENT_NAME} Edit`),
    needs: [{ name: 'Need to delete', priority: 'High', satisfaction: 'Partially Satisfied' }],
  });
  const updatedName = `${client.name} Updated`;

  await gotoClients(page, project);

  const clientCard = page.getByText(client.name, { exact: true }).first();
  await expect(clientCard).toBeVisible({ timeout: 15000 });
  await clientCard.click();

  const editButton = page
    .locator('button')
    .filter({ has: page.locator('svg path[d*="M13.26 3.59924"]') })
    .first();
  await expect(editButton).toBeVisible({ timeout: 15000 });
  await editButton.click();

  const deleteNeedButton = page
    .locator('button')
    .filter({ has: page.locator('svg path[d*="M21 5.98047"]') })
    .first();
  await expect(deleteNeedButton).toBeVisible({ timeout: 15000 });
  await deleteNeedButton.click();

  const confirmDeleteButton = page.getByRole('button', { name: /yes, delete this need/i });
  await expect(confirmDeleteButton).toBeVisible({ timeout: 15000 });
  await confirmDeleteButton.click();

  // Fill the name AFTER the need-delete confirmation, not before: deleting a
  // need refetches the form's data and silently discards an uncommitted name
  // edit made earlier in the same session (confirmed live — see
  // BUG_PATTERNS.md "Client Edit Form Discards an Uncommitted Name Change
  // After Deleting a Need").
  const nameField = page.getByRole('textbox', { name: /name/i }).first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(updatedName);

  const updateButton = page.getByRole('button', { name: /^update$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });
  await expect(page).toHaveURL(/\/triangle\/clients/i, { timeout: 15000 });

  // Persistence check: reload and confirm the new name stuck and the old
  // (pre-edit) name is gone.
  await page.reload();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page).toHaveURL(/\/triangle\/clients/i, { timeout: 15000 });
  await expect(page.getByText(updatedName, { exact: true }).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(client.name, { exact: true })).toHaveCount(0);
});
