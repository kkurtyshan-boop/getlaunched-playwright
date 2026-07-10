// Deletes every project whose name matches the autotest markers
// (/^Autotest/ or /^My Business/) via the backend API.
//
// It discovers the API base URL and the Bearer token by observing a real
// authenticated request the app makes on load — so it needs no .env access.
// Deleting a project cascades to all its child records, which is why the suite
// runs against a disposable project (see scripts/createTestProject.js).
//
//   BASE_URL=... node scripts/cleanupTestProjects.js
//   DRY_RUN=1 ... node scripts/cleanupTestProjects.js   # list only, delete nothing
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'https://frontv2.getlaunched.io';
const EMAIL = process.env.TEST_EMAIL || 'kataratest573@gmail.com';
const PASSWORD = process.env.TEST_PASSWORD || 'Test_11K';
const DRY_RUN = process.env.DRY_RUN === '1';
const MARKER = /^(Autotest|My Business)\b/;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  let apiBase = null; // full prefix up to and including the "/v1" segment
  let authHeader = null;

  // Capture the API base (including any path prefix like /api/v1) and the Bearer
  // Authorization header from the app's authenticated /v1/ traffic. Tracked
  // independently: the first /v1/ request is usually the login (no token yet),
  // so the header only shows up on later requests.
  page.on('request', (req) => {
    const url = req.url();
    const m = url.match(/^(https?:\/\/.*?\/v1)(?:\/|$)/);
    if (!m) return;
    if (!apiBase) apiBase = m[1];
    const auth = req.headers()['authorization'];
    if (auth && /bearer/i.test(auth)) authHeader = auth;
  });

  try {
    // Login so the app fires authenticated API calls.
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).first().click();
    await page.waitForFunction(() => !location.pathname.includes('/sign-in'), null, { timeout: 30000 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Wait until we've observed the API base + token.
    for (let i = 0; i < 30 && (!apiBase || !authHeader); i++) {
      await page.waitForTimeout(500);
    }
    if (!apiBase) throw new Error('Could not determine API base URL from network traffic');
    if (!authHeader) throw new Error('Could not capture Authorization header');

    const headers = { authorization: authHeader, accept: 'application/json' };

    const res = await page.request.get(`${apiBase}/projects`, { headers });
    if (!res.ok()) throw new Error(`GET ${apiBase}/projects failed: ${res.status()}`);
    const body = await res.json();

    // Response shape is defensive: support {data:[...]}, {data:{data:[...]}}, or [...]
    const list = Array.isArray(body) ? body
      : Array.isArray(body.data) ? body.data
      : Array.isArray(body.data?.data) ? body.data.data
      : [];

    const targets = list.filter((p) => MARKER.test(p.name || p.title || ''));

    console.log(`API: ${apiBase}`);
    console.log(`Total projects: ${list.length}. Matching autotest markers: ${targets.length}`);
    for (const p of targets) console.log(`  - ${p.name || p.title}  (${p.uuid || p.id})`);

    if (DRY_RUN) {
      console.log('DRY_RUN=1 — nothing deleted.');
      return;
    }

    let deleted = 0;
    for (const p of targets) {
      const id = p.uuid || p.id;
      const del = await page.request.delete(`${apiBase}/projects/${id}`, { headers });
      if (del.ok()) {
        deleted++;
        console.log(`Deleted: ${p.name || p.title}`);
      } else {
        console.error(`Failed to delete ${p.name || p.title}: ${del.status()}`);
      }
    }
    console.log(`Done. Deleted ${deleted}/${targets.length} project(s).`);
  } catch (e) {
    console.error('Cleanup failed:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
