import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { unique } from './config';
import { createProjectViaUi, ProjectLimitReachedError } from './helpers/project';

// Self-contained: creates its own project rather than depending on
// 02-create-project.spec.js having run first (the old globalThis coupling
// only worked in a single serial process).
test('Edit and delete project', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);

  const projectNameText = unique('Edit Test');
  try {
    await createProjectViaUi(page, { name: projectNameText, description: 'Project created for edit/delete flow' });
  } catch (err) {
    if (err instanceof ProjectLimitReachedError) {
      test.skip(true, `Account is at its project limit (${err.message}) — cannot create a throwaway project to test Edit/Delete.`);
    }
    throw err;
  }

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const createdProjectCard = page.locator('li').filter({ hasText: projectNameText }).first();
  await expect(createdProjectCard).toBeVisible({ timeout: 20000 });

  await createdProjectCard.getByRole('button', { name: /open actions menu/i }).click();

  const editOption = page.getByText(/^edit$/i).first();
  await expect(editOption).toBeVisible({ timeout: 10000 });
  await editOption.click();

  await expect(page.getByRole('heading', { name: /edit project|create project/i }).first()).toBeVisible({ timeout: 15000 });

  const editedWebsite = page.locator('input[placeholder*="https://"]').first();
  await expect(editedWebsite).toBeVisible({ timeout: 15000 });
  await editedWebsite.clear();
  await editedWebsite.fill('https://updatedbusiness.com');

  const editedDescription = page.locator('textarea[placeholder*="Write your story"]').first();
  await expect(editedDescription).toBeVisible({ timeout: 15000 });
  await editedDescription.clear();
  await editedDescription.fill('Updated project description for edit project test');

  const editedIncomeTax = page.locator('input[placeholder*="Type tax"]').first();
  await expect(editedIncomeTax).toBeVisible({ timeout: 15000 });
  await editedIncomeTax.clear();
  await editedIncomeTax.fill('30');

  const editedSelects = page.locator('select');
  await expect(editedSelects.nth(4)).toBeVisible({ timeout: 15000 });
  await editedSelects.nth(4).selectOption({ index: 2 });

  const updateButton = page.getByRole('button', { name: /update project/i }).last();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();

  try {
    await expect(page.locator('body')).toContainText(/updated successfully|project successfully updated|success/i, { timeout: 10000 });
  } catch {
    await expect(page).not.toHaveURL(/\/project\/edit/i, { timeout: 15000 });
  }

  // Persistence check: reload the list and confirm the edited card is still there.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const projectForDelete = page.locator('li').filter({ hasText: projectNameText }).first();
  await expect(projectForDelete).toBeVisible({ timeout: 20000 });

  await projectForDelete.getByRole('button', { name: /open actions menu/i }).click();

  const deleteOption = page.getByText(/delete/i).first();
  await expect(deleteOption).toBeVisible({ timeout: 10000 });
  await deleteOption.click();

  const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 10000 });

  const confirmDeleteButton = dialog.getByRole('button', { name: /delete/i }).first();
  await expect(confirmDeleteButton).toBeVisible({ timeout: 10000 });
  await confirmDeleteButton.click();

  await expect(page.locator('body')).toContainText(/deleted successfully|successfully deleted/i, { timeout: 10000 });
  await expect(projectForDelete).not.toBeVisible({ timeout: 15000 });
});
