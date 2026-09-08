// Creates a disposable project (named by TEST_PROJECT) via the UI, mirroring
// the working create-project flow from tests/02-create-project.spec.js.
// Superseded for routine use by the automatic bootstrap in
// tests/auth.setup.js (see tests/helpers/project.js's ensureTestProject) —
// this remains as a standalone manual utility.
//
//   BASE_URL=... TEST_PROJECT="Autotest 123" node scripts/createTestProject.js
require('dotenv').config();
const { chromium } = require('playwright');

// Same variable names/precedence as tests/config.js (a separate copy since
// that file is ESM and this script is a plain CommonJS Node script).
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
const PROJECT = process.env.TEST_PROJECT_NAME || process.env.TEST_PROJECT;

if (!PROJECT) {
  console.error('TEST_PROJECT env var is required');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  try {
    // Login (fresh — this script does not rely on storageState).
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).first().click();
    await page.waitForFunction(() => !location.pathname.includes('/sign-in'), null, { timeout: 30000 });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    const createProjectButton = page
      .getByRole('button', { name: /^create project$/i })
      .or(page.getByText(/^create project$/i))
      .first();
    await createProjectButton.waitFor({ state: 'visible', timeout: 15000 });
    await createProjectButton.click();

    await page.getByRole('heading', { name: /create project/i }).waitFor({ timeout: 15000 });

    await page.locator('input[placeholder*="Type name"]').first().fill(PROJECT);
    await page.locator('input[placeholder*="https://"]').first().fill('https://autotest.example.com');
    await page.locator('textarea[placeholder*="Write your story"]').first()
      .fill('Disposable project created by the autotest suite.');

    const selects = page.locator('select');
    await selects.nth(0).selectOption({ index: 1 });
    await selects.nth(1).selectOption({ index: 1 });

    const currencyField = page.locator('[role="combobox"]').nth(1);
    await currencyField.click();
    await page.getByRole('option').first().click();

    await page.locator('input[placeholder*="Type tax"]').first().fill('25');

    // Financial year selects (by value, since option index 0 is a placeholder):
    //   nth(2) foundation_year, nth(3) calculation_start_year, nth(4) planning_horizon.
    // The team/resource "Start year" dropdowns list
    // calculation_start_year .. +planning_horizon, and specs 14/16 hardcode
    // 2027 & 2028 — so the horizon must cover them.
    // The specs assume a project with exactly two planning years, 2027 & 2028
    // (hardcoded startYear values, and per-year arrays with 2 entries), matching
    // the original "Dior Brand" setup.
    await selects.nth(2).selectOption('2022');   // foundation year
    await selects.nth(3).selectOption('2027');   // start calculation from 2027
    await selects.nth(4).selectOption('2');      // 2 planning years → 2027 & 2028

    await page.getByRole('button', { name: /^create project$/i }).last().click();

    // Confirm it lands back on the project list with the new card present.
    const card = page.locator('li').filter({ hasText: PROJECT }).first();
    await card.waitFor({ state: 'visible', timeout: 30000 });

    console.log(`Created project: "${PROJECT}"`);
  } catch (e) {
    console.error('Failed to create test project:', e.message);
    await page.screenshot({ path: 'tmp/createTestProject-failed.png', fullPage: true }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
