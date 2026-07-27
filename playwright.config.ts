import { defineConfig, devices } from '@playwright/test';

// Base URL of the app under test.
//   Prod (default):  npx playwright test
//   Local dev:       BASE_URL=http://localhost:5173 npx playwright test
// The app frontend reads its backend from VITE_BACK_API_LINK, so a local
// frontend can still run against the prod API (where the "Dior Brand"
// project and test credentials live).
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
