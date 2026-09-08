// Single source of truth for test credentials, the target project, and every
// reusable fixture-data value. Override any of it per-environment without
// touching code — e.g.:
//   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... TEST_PROJECT_NAME="My Autotest" npx playwright test
//
// TEST_EMAIL / TEST_PASSWORD / TEST_PROJECT (the original names) still work
// as fallbacks so existing muscle memory/CI config keeps working.
//
// No hardcoded fallback account here on purpose — a real email/password
// baked into source would end up committed to git history. Copy
// .env.example to .env and fill in a real test account instead.
function requiredEnv(varName, fallbackVarName) {
  const value = process.env[varName] || process.env[fallbackVarName];
  if (!value) {
    throw new Error(
      `Missing required env var ${varName} (or fallback ${fallbackVarName}). ` +
        'Copy .env.example to .env and fill in a real test account.'
    );
  }
  return value;
}

export const EMAIL = requiredEnv('TEST_USER_EMAIL', 'TEST_EMAIL');
export const PASSWORD = requiredEnv('TEST_USER_PASSWORD', 'TEST_PASSWORD');

// The suite bootstraps this project automatically (see helpers/project.js +
// auth.setup.js) if it doesn't exist yet — nothing depends on "Dior Brand" or
// any other pre-existing project.
export const PROJECT_NAME = process.env.TEST_PROJECT_NAME || process.env.TEST_PROJECT || 'Autotest Project';
export const PROJECT_WEBSITE = 'https://autotest.example.com';
export const PROJECT_DESCRIPTION =
  'Disposable project maintained by the automated test suite. Safe to reconfigure — not real business data.';

// Financial-year selects on the Create/Edit Project form (see
// helpers/project.js's createProjectViaUi). A number of specs fill one input
// per planning-horizon year (Products quantity, Line Staff quantity, Running
// Costs cost) — keep PLANNING_HORIZON_YEARS in sync with every spec that
// assumes a fixed year-column count.
export const FOUNDATION_YEAR = '2022';
export const CALC_START_YEAR = '2027';
export const PLANNING_HORIZON_YEARS = 2;
export const PLANNING_YEARS = Array.from({ length: PLANNING_HORIZON_YEARS }, (_, i) => Number(CALC_START_YEAR) + i);

export const PRODUCT_NAME = process.env.TEST_PRODUCT_NAME || 'Autotest Product';
export const CLIENT_NAME = process.env.TEST_CLIENT_NAME || 'Autotest Client';
export const COMPETITOR_NAME = process.env.TEST_COMPETITOR_NAME || 'Autotest Competitor';
export const CHANNEL_NAME = process.env.TEST_CHANNEL_NAME || 'Autotest Channel';
export const TEAM_MEMBER_NAME = process.env.TEST_TEAM_MEMBER_NAME || 'Autotest Member';
export const RESOURCE_NAME = process.env.TEST_RESOURCE_NAME || 'Autotest Resource';
export const RISK_NAME = process.env.TEST_RISK_NAME || 'Autotest Risk';
export const MVP_NAME = process.env.TEST_MVP_NAME || 'Autotest MVP';
export const STAGE_NAME = process.env.TEST_STAGE_NAME || 'Autotest Stage';
export const TASK_NAME = process.env.TEST_TASK_NAME || 'Autotest Task';

// Run-scoped uniqueness for fixture data (item 11 of the request): every
// call in the same run gets its own suffix even inside a tight loop, so
// re-running the suite never silently collides with a prior run's records.
let uniqueCounter = 0;
export function unique(base) {
  uniqueCounter += 1;
  return `${base} ${Date.now()}-${uniqueCounter}`;
}

// Operations → Other → Location Analysis / Supplier Analysis (see
// helpers/other.helper.js).
export const LOCATION_NAME = process.env.TEST_LOCATION_NAME || 'Autotest Location';
export const SUPPLIER_NAME = process.env.TEST_SUPPLIER_NAME || 'Autotest Supplier';
