import { test, expect } from '@playwright/test';

test('Login and create project', async ({ page }) => {
  // LOGIN
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

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
    signInButton.click(),
  ]);

  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page).not.toHaveURL(/\/sign-in/i);

  // GO TO PROJECTS PAGE
  await page.goto('https://frontv2.getlaunched.io/', {
    waitUntil: 'domcontentloaded',
  });

  const createProjectButton = page
    .getByRole('button', { name: /^create project$/i })
    .or(page.getByText(/^create project$/i))
    .first();

  await expect(createProjectButton).toBeVisible({ timeout: 15000 });
  await createProjectButton.click();

  // OPEN CREATE PROJECT FORM
  await expect(page.getByRole('heading', { name: /create project/i })).toBeVisible({ timeout: 15000 });

  // FILL PROJECT FORM
  const projectName = page.locator('input[placeholder*="Type name"]').first();
  const website = page.locator('input[placeholder*="https://"]').first();
  const description = page.locator('textarea[placeholder*="Write your story"]').first();
  const incomeTax = page.locator('input[placeholder*="Type tax"]').first();

  await expect(projectName).toBeVisible({ timeout: 15000 });
  await projectName.fill(`My Business ${Date.now()}`);

  await expect(website).toBeVisible({ timeout: 15000 });
  await website.fill('https://mybusiness.com');

  await expect(description).toBeVisible({ timeout: 15000 });
  await description.fill('An intelligent business planning platform featuring AI');

  // DROPDOWNS / SELECTS
  const selects = page.locator('select');

  await expect(selects.nth(0)).toBeVisible({ timeout: 15000 });
  await selects.nth(0).selectOption({ index: 1 }); // Legal form

  await expect(selects.nth(1)).toBeVisible({ timeout: 15000 });
  await selects.nth(1).selectOption({ index: 1 }); // Development stage

  // CURRENCY - Input combobox (другий combobox - для валюти)
  const currencyInput = page.locator('input[role="combobox"]').nth(1);
  await expect(currencyInput).toBeVisible({ timeout: 15000 });
  
  // Клікаємо на input щоб відкрити dropdown
  await currencyInput.click();
  await page.waitForLoadState('networkidle').catch(() => {});
  
  // Вводимо текст "Australian Dollar"
  await currencyInput.fill('Australian Dollar');
  await page.waitForTimeout(500);
  
  // Вибираємо першу опцію
  const currencyOption = page.getByRole('option').filter({ hasText: /australian dollar/i }).first();
  await expect(currencyOption).toBeVisible({ timeout: 15000 });
  await currencyOption.click();

  await expect(incomeTax).toBeVisible({ timeout: 15000 });
  await incomeTax.fill('25');

  await expect(selects.nth(2)).toBeVisible({ timeout: 15000 });
  await selects.nth(2).selectOption({ index: 1 }); // Year of foundation

  await expect(selects.nth(3)).toBeVisible({ timeout: 15000 });
  await selects.nth(3).selectOption({ index: 1 }); // Start calculation from

  await expect(selects.nth(4)).toBeVisible({ timeout: 15000 });
  await selects.nth(4).selectOption({ index: 1 }); // Planning years

  // CREATE PROJECT
  const submitButton = page
    .getByRole('button', { name: /^create project$/i })
    .last();

  await expect(submitButton).toBeVisible({ timeout: 15000 });
  await submitButton.click();

  // SUCCESS - чекаємо на перенаправлення або успіх повідомлення
  try {
    // Чекаємо на успіх повідомлення
    await expect(page.locator('body')).toContainText(/project successfully created|created successfully/i, { timeout: 10000 });
  } catch {
    // Якщо повідомлення не з'явилося, чекаємо на перенаправлення з /create
    await expect(page).not.toHaveURL(/\/project\/create/i, { timeout: 15000 });
  }
});