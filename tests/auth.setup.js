import { test as setup } from '@playwright/test';
import { login } from './helpers';

// Runs once before the chromium project (see playwright.config.ts) and saves
// the authenticated session so specs don't each re-login through the UI.
setup('authenticate', async ({ page }) => {
  await login(page);
  await page.context().storageState({ path: 'storageState.json' });
});
