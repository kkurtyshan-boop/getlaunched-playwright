import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

// Loads .env (gitignored — see .env.example for the full list of variables
// this suite reads) so BASE_URL / TEST_USER_EMAIL / TEST_USER_PASSWORD /
// TEST_PROJECT_NAME can be set in one file instead of exported in the shell
// every time. A real shell-exported env var still wins over .env (dotenv
// never overwrites an already-set process.env value).
//
// Base URL of the app under test.
//   Prod (default):  npx playwright test
//   Local dev:       BASE_URL=https://local.getlaunched.io:3000 npx playwright test
// The app frontend reads its backend from VITE_BACK_API_LINK, so a local
// frontend can still run against the prod API (where the test account and
// its bootstrapped "Autotest Project" live — see tests/helpers/project.js).
const BASE_URL = process.env.BASE_URL || 'https://frontv2.getlaunched.io';

// Headed by default for day-to-day debugging; set HEADLESS=1 in CI.
const HEADLESS = process.env.HEADLESS === '1';

export default defineConfig({
  testDir: './tests',

  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: 'html',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    headless: HEADLESS,
    // Local dev is served over HTTPS with a self-signed cert.
    ignoreHTTPSErrors: true,
  },

  projects: [
    // Authenticates once via the UI and writes storageState.json.
    { name: 'setup', testMatch: /auth\.setup\.js/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'storageState.json',
      },
      dependencies: ['setup'],
    },
  ],
});
