import { test, expect } from '@playwright/test';

const sharedState = globalThis;

test('Login and create project', async ({ page }) => {
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

  await signInButton.click();

  await expect(
    page.getByRole('heading', { name: /select a project/i }).first()
  ).toBeVisible({ timeout: 30000 });
  await expect(page).not.toHaveURL(/\/sign-in/i, { timeout: 30000 });

  await page.goto('https://frontv2.getlaunched.io/', {
    waitUntil: 'domcontentloaded',
  });

  const createProjectButton = page
    .getByRole('button', { name: /^create project$/i })
    .or(page.getByText(/^create project$/i))
    .first();

  await expect(createProjectButton).toBeVisible({ timeout: 15000 });
  await createProjectButton.click();

  await expect(page.getByRole('heading', { name: /create project/i })).toBeVisible({ timeout: 15000 });

  const projectName = page.locator('input[placeholder*="Type name"]').first();
  const website = page.locator('input[placeholder*="https://"]').first();
  const description = page.locator('textarea[placeholder*="Write your story"]').first();
  const incomeTax = page.locator('input[placeholder*="Type tax"]').first();

  const projectNameText = `My Business ${Date.now()}`;

  await expect(projectName).toBeVisible({ timeout: 15000 });
  await projectName.fill(projectNameText);

  await expect(website).toBeVisible({ timeout: 15000 });
  await website.fill('https://mybusiness.com');

  await expect(description).toBeVisible({ timeout: 15000 });
  await description.fill('An intelligent business planning platform featuring AI');

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

  await expect(page.getByRole('heading', { name: /select a project/i }).first()).toBeVisible({ timeout: 20000 });
  const createdProjectCard = page.locator('li').filter({ hasText: projectNameText }).first();
  await expect(createdProjectCard).toBeVisible({ timeout: 20000 });

  sharedState.__createdProjectName = projectNameText;
});
