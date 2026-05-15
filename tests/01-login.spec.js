import { test, expect } from '@playwright/test';

test('login test', async ({ page }) => {
  await page.goto('https://frontv2.getlaunched.io/sign-in', {
    waitUntil: 'domcontentloaded',
  });

  const email = page.locator('input[placeholder="info@example.com"]');
  const password = page.locator('#password');

  await email.waitFor({ state: 'visible', timeout: 15000 });
  await email.fill('kataratest573@gmail.com');

  await password.fill('Test_11K');

  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('https://frontv2.getlaunched.io/');
});