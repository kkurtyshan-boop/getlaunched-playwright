import { expect } from '@playwright/test';

// Single source of truth for test credentials and the target project.
// Override per-environment without touching code:
//   TEST_EMAIL, TEST_PASSWORD, TEST_PROJECT
export const EMAIL = process.env.TEST_EMAIL || 'kataratest573@gmail.com';
export const PASSWORD = process.env.TEST_PASSWORD || 'Test_11K';
export const PROJECT_NAME = process.env.TEST_PROJECT || 'Dior Brand';

/**
 * Log in through the UI.
 *
 * Idempotent: when the run already carries an authenticated `storageState`
 * (see auth.setup.js + playwright.config.ts), the sign-in form never appears
 * and this returns immediately. So it is safe to call at the top of every
 * spec whether or not storageState is present.
 */
export async function login(page) {
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

  const email = page.locator('input[type="email"]').first();

  // Already authenticated via storageState → app redirects away from /sign-in
  // and the email field is never rendered. Short-circuit.
  try {
    await expect(email).toBeVisible({ timeout: 3000 });
  } catch {
    return;
  }

  const password = page.locator('input[type="password"]').first();
  const signInButton = page.getByRole('button', { name: /sign in/i }).first();

  await email.fill(EMAIL);
  await expect(password).toBeVisible({ timeout: 15000 });
  await password.fill(PASSWORD);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
    signInButton.click(),
  ]);

  // The app never truly reaches network-idle (background polling), so bound it.
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page).not.toHaveURL(/\/sign-in/i, { timeout: 30000 });
}
