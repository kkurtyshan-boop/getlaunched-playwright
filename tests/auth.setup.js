import { chromium } from '@playwright/test';
import fs from 'fs';

async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://frontv2.getlaunched.io/sign-in', {
    waitUntil: 'domcontentloaded',
  });

  const email = page.locator('input[placeholder="info@example.com"]');
  const password = page.locator('#password');

  await email.waitFor({ state: 'visible', timeout: 15000 });
  await email.fill('kataratest573@gmail.com');

  await password.fill('Test_11K');

  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL('https://frontv2.getlaunched.io/');

  fs.mkdirSync('playwright/.auth', { recursive: true });
  await context.storageState({ path: 'playwright/.auth/user.json' });

  await browser.close();
}

export default globalSetup;