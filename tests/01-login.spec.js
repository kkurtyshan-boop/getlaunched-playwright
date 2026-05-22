import { test, expect } from '@playwright/test';

test('Login', async ({ page }) => {
  await page.goto('https://frontv2.getlaunched.io/sign-in');

  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();

  await email.fill('kataratest573@gmail.com');
  await password.fill('Test_11K');

  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/getlaunched/i);
});