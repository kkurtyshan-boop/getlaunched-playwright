const { chromium } = require('playwright');

// Standalone helper to regenerate storageState.json manually.
// The test run now does this automatically via tests/auth.setup.js, so you
// rarely need this — but it's handy for a quick one-off session refresh.
//   BASE_URL, TEST_EMAIL, TEST_PASSWORD override the defaults below.
const BASE_URL = process.env.BASE_URL || 'https://frontv2.getlaunched.io';
const EMAIL = process.env.TEST_EMAIL || 'kataratest573@gmail.com';
const PASSWORD = process.env.TEST_PASSWORD || 'Test_11K';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForSelector('text=Select a project', { timeout: 30000 });
    await context.storageState({ path: 'storageState.json' });
    console.log('Saved storageState.json');
  } catch (e) {
    console.error('Failed to save storage state:', e);
    await page.screenshot({ path: 'tmp/saveStorageState-failed.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
