import { test, expect } from '@playwright/test';
import { EMAIL, PASSWORD } from './helpers';

// The login test must exercise the sign-in form itself, so it opts OUT of the
// shared authenticated storageState and starts from a clean, logged-out state.
test.use({ storageState: { cookies: [], origins: [] } });

test('Login', async ({ page }) => {
  await page.goto('/sign-in');

  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();

  await email.fill(EMAIL);
  await password.fill(PASSWORD);

  await page.getByRole('button', { name: /sign in/i }).click();

  // Assert we left the sign-in screen (host-agnostic — works on prod and local).
  await expect(page).not.toHaveURL(/\/sign-in/i, { timeout: 30000 });
});
