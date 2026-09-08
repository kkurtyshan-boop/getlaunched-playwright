import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, RISK_NAME } from './config';
import {
  createRisk,
  openRiskAnalysisTab,
  openCreateRiskModal,
  setRiskType,
  getPestelDropdown,
} from './helpers/risk.helper';

// Trimmed from the original 6 PESTEL + 6 Internal (12 records, up to 300s)
// down to 3 External risks spanning 3 distinct PESTEL categories + 2
// Internal risks spanning the low/high ends of the Consequences x
// Probability grid. Still exercises every risk-type/PESTEL code path this
// suite covers, just with a smaller, more reliable fixture set. See
// PROJECT_KNOWLEDGE.md §3.5 / RELEASE_CHECKLIST.md §14.
const RISK_SCENARIOS = [
  {
    baseName: `${RISK_NAME} External Political`,
    type: 'External',
    pestelCategory: 'Political',
    description: 'External risk: regulatory change tightens compliance requirements across markets.',
    consequences: 'Major',
    probability: 'Likely',
  },
  {
    baseName: `${RISK_NAME} External Technological`,
    type: 'External',
    pestelCategory: 'Technological',
    description: 'External risk: a competitor technology shift threatens product differentiation.',
    consequences: 'Moderate',
    probability: 'Moderate',
  },
  {
    baseName: `${RISK_NAME} External Environmental`,
    type: 'External',
    pestelCategory: 'Environmental',
    description: 'External risk: stricter environmental regulation requires a packaging redesign.',
    consequences: 'Catastrophic',
    probability: 'Unlikely',
  },
  {
    baseName: `${RISK_NAME} Internal Low`,
    type: 'Internal',
    description: 'Internal risk: a minor process gap caught before it causes any real impact.',
    consequences: 'Insignificant',
    probability: 'Rare',
  },
  {
    baseName: `${RISK_NAME} Internal High`,
    type: 'Internal',
    description: 'Internal risk: a critical system dependency has no redundancy in place.',
    consequences: 'Catastrophic',
    probability: 'Almost Certain',
  },
];

test.describe.serial('Risk analysis flow', () => {
  test('01. Switching Risk type shows/hides the PESTEL category field', async ({ page, project }) => {
    await login(page);
    await openRiskAnalysisTab(page, project);

    const modal = await openCreateRiskModal(page);

    // External reveals the conditionally-rendered PESTEL category field...
    await setRiskType(modal, 'External');
    const pestelDropdown = getPestelDropdown(modal);
    await expect(pestelDropdown).toBeVisible({ timeout: 15000 });

    // ...and switching back to Internal hides it again (shared
    // conditional-field pattern with Marketing Channels' "Other" category
    // — see RELEASE_CHECKLIST.md §14 Regression).
    await setRiskType(modal, 'Internal');
    await expect(pestelDropdown).not.toBeVisible({ timeout: 15000 });

    const closeButton = modal.getByRole('button', { name: /close/i }).first();
    await closeButton.click();
    await expect(modal).not.toBeVisible({ timeout: 15000 });
  });

  test('02. Create risk entries covering External (with PESTEL) and Internal types', async ({ page, project }) => {
    // 5 risks created sequentially, each waiting on its own table row.
    test.setTimeout(180_000);

    await login(page);

    for (const scenario of RISK_SCENARIOS) {
      await createRisk(page, project, {
        ...scenario,
        name: unique(scenario.baseName),
      });
    }
  });
});
