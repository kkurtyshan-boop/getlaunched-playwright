require('dotenv').config();
const { chromium } = require('playwright');

// Standalone helper to regenerate storageState.json manually.
// The test run now does this automatically via tests/auth.setup.js, so you
// rarely need this — but it's handy for a quick one-off session refresh.
//   BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD override the defaults below
//   (same variable names/precedence as tests/config.js — a separate copy
//   here since that file is ESM and this script is a plain CommonJS script).
const BASE_URL = process.env.BASE_URL || 'https://frontv2.getlaunched.io';

// No hardcoded fallback account — see tests/config.js for the same rule.
function requiredEnv(varName, fallbackVarName) {
  const value = process.env[varName] || process.env[fallbackVarName];
  if (!value) {
    console.error(`Missing required env var ${varName} (or fallback ${fallbackVarName}). Copy .env.example to .env and fill in a real test account.`);
    process.exit(1);
  }
  return value;
}

const EMAIL = requiredEnv('TEST_USER_EMAIL', 'TEST_EMAIL');
const PASSWORD = requiredEnv('TEST_USER_PASSWORD', 'TEST_PASSWORD');

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
