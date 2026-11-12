import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, LOCATION_NAME, SUPPLIER_NAME } from './config';
import {
  saveIpRight,
  IP_STATUS,
  expandAccordionSection,
  createLocation,
  createSupplier,
  createAnalysisCriterion,
  getMatrixColumnIndex,
  setMatrixScore,
  verifyWeightedScore,
} from './helpers/other.helper';

// Operations → Other: Intellectual Property Rights, Location Analysis,
// Supplier Analysis (PROJECT_KNOWLEDGE.md §3.3). Location Analysis and
// Supplier Analysis share the exact same 3-part shape as Competitors'
// Evaluation Matrix (items + weighted Criteria Configuration + comparison
// matrix) — see helpers/other.helper.js, which reimplements
// helpers/evaluation.helper.js's proven column-index-by-name approach scoped
// to each module's own accordion region (both modules render an identically
// named "Criteria Configuration" section, so a page-wide lookup would be
// ambiguous).
// IP Rights (redesigned 2026-11): one "Have it" type with a stage, one
// "Planned" type, and one "Not relevant" — covers all three status shapes.
const IP_TYPES = [
  {
    type: 'Trademark',
    status: IP_STATUS.have,
    stage: 'Registered',
    registrationNumber: 'TM-AUTOTEST-001',
    description: unique('Brand name and logo registered; renewals tracked annually.'),
  },
  {
    type: 'Design',
    status: IP_STATUS.planned,
    description: unique('Product design filing planned for next year.'),
  },
  { type: 'Copyright', status: IP_STATUS.notRelevant },
];

// Trimmed to 2 items each (was 3) for the same resource-footprint reason as
// IP_TYPES above — 2 items is still enough to exercise the weighted
// comparison-matrix math meaningfully while roughly halving the DOM churn
// (matrix cells scale as items × criteria) on this memory-constrained
// shared machine.
const LOCATIONS = [
  { name: unique(LOCATION_NAME), address: '10 Market Street, Springfield' },
  { name: unique(LOCATION_NAME), address: '25 Harbor Avenue, Rivertown' },
];

const LOCATION_CRITERIA = [
  { name: unique('Autotest Location Criterion Rent'), weight: '6', scores: ['4', '9'] },
  { name: unique('Autotest Location Criterion Traffic'), weight: '9', scores: ['8', '6'] },
];

const SUPPLIERS = [
  { name: unique(SUPPLIER_NAME), email: 'supplier.a@autotest.example.com', country: 'Germany' },
  { name: unique(SUPPLIER_NAME), email: 'supplier.b@autotest.example.com', country: 'Poland' },
];

const SUPPLIER_CRITERIA = [
  { name: unique('Autotest Supplier Criterion Quality'), weight: '10', scores: ['9', '7'] },
  { name: unique('Autotest Supplier Criterion Cost'), weight: '6', scores: ['5', '8'] },
];

test.describe.serial('Other (Operations) flow', () => {
  // Threaded from Location Analysis into Supplier Analysis to verify the
  // two modules' criteria stay independent datasets (RELEASE_CHECKLIST §11).
  let locationCriterionName;

  test('01. Save intellectual property rights in each status', async ({ page, project }) => {
    // 3 IP types saved sequentially, each with a reload-based persistence
    // check — exceeds the default 30s timeout.
    test.setTimeout(180_000);
    await login(page);

    for (const ipType of IP_TYPES) {
      await saveIpRight(page, project, ipType);
    }
  });

  test('02. Fill location analysis: locations, criteria and comparison matrix', async ({ page, project }) => {
    // 3 locations + 3 criteria + 9 matrix cells — exceeds the default 30s timeout.
    test.setTimeout(240_000);
    await login(page);

    for (const location of LOCATIONS) {
      await createLocation(page, project, location);
    }

    const region = await expandAccordionSection(page, /Location Analysis/i);
    for (const criterion of LOCATION_CRITERIA) {
      await createAnalysisCriterion(page, region, criterion);
    }
    locationCriterionName = LOCATION_CRITERIA[0].name;

    const columnIndexes = [];
    for (const location of LOCATIONS) {
      columnIndexes.push(await getMatrixColumnIndex(page, region, location.name));
    }

    for (const criterion of LOCATION_CRITERIA) {
      for (let li = 0; li < LOCATIONS.length; li++) {
        await setMatrixScore(page, region, criterion.name, columnIndexes[li], criterion.scores[li]);
      }
    }

    for (const location of LOCATIONS) {
      await verifyWeightedScore(page, region, location.name);
    }
  });

  test('03. Fill supplier analysis: suppliers, criteria and comparison matrix', async ({ page, project }) => {
    // 3 suppliers + 3 criteria + 9 matrix cells — exceeds the default 30s timeout.
    test.setTimeout(240_000);
    await login(page);

    for (const supplier of SUPPLIERS) {
      await createSupplier(page, project, supplier);
    }

    const region = await expandAccordionSection(page, /Supplier Analysis/i);
    for (const criterion of SUPPLIER_CRITERIA) {
      await createAnalysisCriterion(page, region, criterion);
    }

    const columnIndexes = [];
    for (const supplier of SUPPLIERS) {
      columnIndexes.push(await getMatrixColumnIndex(page, region, supplier.name));
    }

    for (const criterion of SUPPLIER_CRITERIA) {
      for (let si = 0; si < SUPPLIERS.length; si++) {
        await setMatrixScore(page, region, criterion.name, columnIndexes[si], criterion.scores[si]);
      }
    }

    for (const supplier of SUPPLIERS) {
      await verifyWeightedScore(page, region, supplier.name);
    }

    // Location Analysis's criteria must not leak into Supplier Analysis's
    // own Criteria Configuration / comparison matrix.
    await expect(region).not.toContainText(locationCriterionName);
  });
});
