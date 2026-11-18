import { expect } from '@playwright/test';

// Credentials/project name now live in tests/config.js (also home to every
// other reusable fixture-data value); re-exported here so existing imports
// (`import { login, PROJECT_NAME } from './helpers'`) keep working.
export { EMAIL, PASSWORD, PROJECT_NAME } from './config';
import { EMAIL, PASSWORD } from './config';

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

  await submitSignIn(page);
}

// Every full page load spends the rotating refresh token, so one interrupted refresh signs the page out mid-test.
export async function reauthIfSignedOut(page) {
  if (!/^\/sign-in/i.test(new URL(page.url()).pathname)) return false;
  await submitSignIn(page);
  return true;
}

async function submitSignIn(page) {
  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();
  const signInButton = page.getByRole('button', { name: /sign in/i }).first();

  await expect(email).toBeVisible({ timeout: 15000 });
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
