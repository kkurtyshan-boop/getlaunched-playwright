import { test, expect } from '@playwright/test';
import { login } from './helpers';

const sharedState = globalThis;

test('Login, create, edit and delete project', async ({ page }) => {
  await login(page);

  let projectNameText = sharedState.__createdProjectName;

  if (!projectNameText) {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
    });

    const createProjectButton = page
      .getByRole('button', { name: /^create project$/i })
      .or(page.getByText(/^create project$/i))
      .first();

    await expect(createProjectButton).toBeVisible({ timeout: 15000 });
    await createProjectButton.click();

    await expect(page.getByRole('heading', { name: /create project/i })).toBeVisible({ timeout: 15000 });

    projectNameText = `Edit Test ${Date.now()}`;
    const projectName = page.locator('input[placeholder*="Type name"]').first();
    const website = page.locator('input[placeholder*="https://"]').first();
    const description = page.locator('textarea[placeholder*="Write your story"]').first();
    const incomeTax = page.locator('input[placeholder*="Type tax"]').first();

    await expect(projectName).toBeVisible({ timeout: 15000 });
    await projectName.fill(projectNameText);

    await expect(website).toBeVisible({ timeout: 15000 });
    await website.fill('https://mybusiness.com');

    await expect(description).toBeVisible({ timeout: 15000 });
    await description.fill('Project created for edit/delete flow');

    const selects = page.locator('select');

    await expect(selects.nth(0)).toBeVisible({ timeout: 15000 });
    await selects.nth(0).selectOption({ index: 1 });

    await expect(selects.nth(1)).toBeVisible({ timeout: 15000 });
    await selects.nth(1).selectOption({ index: 1 });

    const currencyField = page.locator('[role="combobox"]').nth(1);
    await expect(currencyField).toBeVisible({ timeout: 15000 });
    await currencyField.click();

    const currencyOption = page.getByRole('option').first();
    await expect(currencyOption).toBeVisible({ timeout: 15000 });
    await currencyOption.click();

    await expect(incomeTax).toBeVisible({ timeout: 15000 });
    await incomeTax.fill('25');

    await expect(selects.nth(2)).toBeVisible({ timeout: 15000 });
    await selects.nth(2).selectOption('2022');

    await expect(selects.nth(3)).toBeVisible({ timeout: 15000 });
    await selects.nth(3).selectOption({ index: 1 });

    await expect(selects.nth(4)).toBeVisible({ timeout: 15000 });
    await selects.nth(4).selectOption({ index: 1 });

    const submitButton = page.getByRole('button', { name: /^create project$/i }).last();
    await expect(submitButton).toBeVisible({ timeout: 15000 });
    await submitButton.click();

    try {
      await expect(page.locator('body')).toContainText(/project successfully created|created successfully/i, { timeout: 10000 });
    } catch {
      await expect(page).not.toHaveURL(/\/project\/create/i, { timeout: 15000 });
    }

    sharedState.__createdProjectName = projectNameText;
  }

  await page.goto('/', {
    waitUntil: 'domcontentloaded',
  });

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

  await page.goto('/', {
    waitUntil: 'domcontentloaded',
  });

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
