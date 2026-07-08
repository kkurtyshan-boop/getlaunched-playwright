const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('https://frontv2.getlaunched.io/sign-in', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'kataratest573@gmail.com');
    await page.fill('input[type="password"]', 'Test_11K');
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