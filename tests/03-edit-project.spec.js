import { test, expect } from '@playwright/test';

test('Login and edit project', async ({ page }) => {
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

  // OPEN PROJECTS PAGE
  await page.goto('https://frontv2.getlaunched.io/', {
    waitUntil: 'domcontentloaded',
  });

  // FIND PROJECT CARD
  const projectCard = page.locator('div').filter({
    hasText: /My Business/i,
  }).first();

  await expect(projectCard).toBeVisible({
    timeout: 15000,
  });

  // OPEN MENU (...)
  const menuButton = projectCard.locator('button').last();

  await expect(menuButton).toBeVisible({
    timeout: 15000,
  });

  await menuButton.click();

  // CLICK EDIT
  const editButton = page.getByText(/^edit$/i);

  await expect(editButton).toBeVisible({
    timeout: 15000,
  });

  await editButton.click();

  // CHECK EDIT PAGE
  await expect(
    page.getByRole('heading', {
      name: /edit project|create project/i,
    })
  ).toBeVisible({
    timeout: 15000,
  });

  

  // EDIT WEBSITE
  const website = page
    .locator('input[placeholder*="https://"]')
    .first();

  await expect(website).toBeVisible({
    timeout: 15000,
  });

  await website.clear();
  await website.fill('https://updatedbusiness.com');

  // EDIT DESCRIPTION
  const description = page
    .locator('textarea[placeholder*="Write your story"]')
    .first();

  await expect(description).toBeVisible({
    timeout: 15000,
  });

  await description.clear();
  await description.fill('Updated project description for edit project test');

  // EDIT INCOME TAX
  const incomeTax = page
    .locator('input[placeholder*="Type tax"]')
    .first();

  await expect(incomeTax).toBeVisible({
    timeout: 15000,
  });

  await incomeTax.clear();
  await incomeTax.fill('30');

  // CHANGE PLANNING YEARS
  const selects = page.locator('select');

  await expect(selects.nth(4)).toBeVisible({
    timeout: 15000,
  });

  await selects.nth(4).selectOption({ index: 2 });

  // UPDATE PROJECT
  const updateButton = page
    .getByRole('button', { name: /update project/i });

  await expect(updateButton).toBeVisible({
    timeout: 15000,
  });

  await updateButton.click();

  // SUCCESS CHECK
  try {
    await expect(page.locator('body')).toContainText(
      /updated successfully|project successfully updated|success/i,
      { timeout: 10000 }
    );
  } catch {
    await expect(page).not.toHaveURL(
      /\/project\/edit/i,
      { timeout: 15000 }
    );
  }
});