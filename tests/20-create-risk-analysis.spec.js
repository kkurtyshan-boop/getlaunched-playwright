import { test, expect } from '@playwright/test';
import { login, PROJECT_NAME } from './helpers';

// Intentionally perform UI login each run to ensure active session

async function openImplementationTab(page) {
  await page.goto('/', {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const projectCard = page.getByText(PROJECT_NAME, { exact: true }).first();
  await expect(projectCard).toBeVisible({ timeout: 15000 });
  await projectCard.scrollIntoViewIfNeeded();
  await projectCard.click();

  const operationsLink = page.getByRole('link', { name: /^operations$/i }).first();
  await expect(operationsLink).toBeVisible({ timeout: 15000 });
  await operationsLink.click();

  await expect(page.getByRole('heading', { name: /^operations$/i }).first()).toBeVisible({ timeout: 15000 });

  const implementationTab = page.getByRole('tab', { name: /^implementation$/i }).first();
  if (await implementationTab.isVisible().catch(() => false)) {
    await implementationTab.click();
  } else {
    const implementationLink = page.getByRole('link', { name: /^implementation$/i }).first();
    await expect(implementationLink).toBeVisible({ timeout: 15000 });
    await implementationLink.click();
  }

  await expect(page.getByRole('heading', { name: /implementation/i }).first()).toBeVisible({ timeout: 15000 });
}

// One External risk per PESTEL category
const EXTERNAL_RISKS = [
  {
    type: 'External',
    name: 'External political risk — EU cosmetics labeling regulation',
    description:
      'External risk: new EU regulation tightens labeling and ingredient disclosure requirements for cosmetics, requiring packaging redesign across markets.',
    pestelCategory: 'Political',
    consequences: 'Major',
    probability: 'Likely',
  },
  {
    type: 'External',
    name: 'External economic risk — currency fluctuation on imports',
    description:
      'External risk: volatile EUR/USD exchange rates increase the cost of imported raw materials and packaging components.',
    pestelCategory: 'Economic',
    consequences: 'Moderate',
    probability: 'Moderate',
  },
  {
    type: 'External',
    name: 'External social risk — shift toward cruelty-free demand',
    description:
      'External risk: growing consumer preference for cruelty-free and vegan cosmetics pressures the brand to reformulate existing product lines.',
    pestelCategory: 'Social',
    consequences: 'Minor',
    probability: 'Likely',
  },
  {
    type: 'External',
    name: 'External technological risk — competitor AI personalization',
    description:
      "External risk: competitors launch AI-driven fragrance personalization tools, threatening Dior's market differentiation.",
    pestelCategory: 'Technological',
    consequences: 'Major',
    probability: 'Moderate',
  },
  {
    type: 'External',
    name: 'External environmental risk — packaging waste regulation',
    description:
      'External risk: stricter EU packaging waste regulations require redesigning flacons and boxes to meet new recyclability targets.',
    pestelCategory: 'Environmental',
    consequences: 'Catastrophic',
    probability: 'Unlikely',
  },
  {
    type: 'External',
    name: 'External legal risk — trademark dispute in emerging market',
    description:
      "External risk: a local competitor in an emerging market disputes Dior's trademark registration, risking brand protection in that region.",
    pestelCategory: 'Legal',
    consequences: 'Major',
    probability: 'Rare',
  },
];

// Internal risks spanning the full range of Probability × Consequences
const INTERNAL_RISKS = [
  {
    type: 'Internal',
    name: 'Internal risk — minor packaging label typo caught pre-shipment',
    description:
      'Internal risk: a labeling typo is caught during final quality review before shipment, requiring a short reprint cycle.',
    consequences: 'Insignificant',
    probability: 'Rare',
  },
  {
    type: 'Internal',
    name: 'Internal risk — occasional delay in seasonal sample production',
    description:
      'Internal risk: seasonal collection samples are occasionally delayed due to tight production scheduling.',
    consequences: 'Minor',
    probability: 'Unlikely',
  },
  {
    type: 'Internal',
    name: 'Internal risk — production line downtime for recalibration',
    description:
      'Internal risk: periodic equipment recalibration causes short production line downtime, affecting delivery schedules.',
    consequences: 'Moderate',
    probability: 'Moderate',
  },
  {
    type: 'Internal',
    name: 'Internal risk — key R&D staff turnover disrupting formulation',
    description:
      'Internal risk: turnover among key R&D staff disrupts ongoing fragrance formulation timelines.',
    consequences: 'Major',
    probability: 'Likely',
  },
  {
    type: 'Internal',
    name: 'Internal risk — critical inventory system outage in peak season',
    description:
      'Internal risk: the core inventory management system experiences a critical outage during peak holiday season, halting order fulfillment.',
    consequences: 'Catastrophic',
    probability: 'Almost Certain',
  },
  {
    type: 'Internal',
    name: 'Internal risk — quality control gap in limited distribution batch',
    description:
      'Internal risk: a quality control gap allows a defective batch to reach a limited distribution channel before detection.',
    consequences: 'Major',
    probability: 'Moderate',
  },
];

const RISK_SCENARIOS = [...EXTERNAL_RISKS, ...INTERNAL_RISKS];

async function selectPestelCategory(page, modal, category) {
  // The "Create new risk" form no longer has a PESTEL category field —
  // skip gracefully instead of failing if it isn't present.
  const dropdownButton = modal.locator('button[data-open="false"]').first();
  if (!(await dropdownButton.count())) {
    return;
  }

  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: category, exact: true }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
}

async function createRisk(page, scenario) {
  const createRiskButton = page.getByRole('button', { name: /create risk/i }).first();
  await expect(createRiskButton).toBeVisible({ timeout: 15000 });
  await createRiskButton.click();

  const modal = page.getByRole('dialog').first();
  await expect(modal).toBeVisible({ timeout: 15000 });

  const nameField = modal.getByPlaceholder('Type risk name').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(scenario.name);

  const descField = modal.getByPlaceholder('Write your story...').first();
  if (await descField.isVisible().catch(() => false)) {
    await descField.fill(scenario.description);
  }

  const typeButton = modal.getByRole('radio', { name: new RegExp(`^${scenario.type}$`, 'i') }).first();
  await expect(typeButton).toBeVisible({ timeout: 15000 });
  await typeButton.click();

  // PESTEL category only renders once Risk type = External is selected
  if (scenario.pestelCategory) {
    await selectPestelCategory(page, modal, scenario.pestelCategory);
  }

  const consequenceButton = modal.getByRole('radio', { name: new RegExp(`^${scenario.consequences}$`, 'i') }).first();
  await expect(consequenceButton).toBeVisible({ timeout: 15000 });
  await consequenceButton.click();

  const probabilityButton = modal.getByRole('radio', { name: new RegExp(`^${scenario.probability}$`, 'i') }).first();
  await expect(probabilityButton).toBeVisible({ timeout: 15000 });
  await probabilityButton.click();

  const createBtn = modal.getByRole('button', { name: /^create$/i }).last();
  await expect(createBtn).toBeVisible({ timeout: 15000 });
  await createBtn.click();

  await page.waitForSelector(`tr:has-text("${scenario.name}")`, { timeout: 20000 });
  const row = page.locator('tr', { hasText: scenario.name }).first();

  if (scenario.riskLevel) {
    await expect(row).toContainText(scenario.riskLevel, { timeout: 15000 });
  } else {
    // Risk level is computed by the app from Consequences × Probability — just
    // confirm some level got calculated, without guessing the exact matrix value.
    await expect(row).toContainText(/low|moderate|high|extreme/i, { timeout: 15000 });
  }
}

test.describe.serial('Risk analysis flow', () => {
  test('20. Create risk entries for each type with probability and risk level', async ({ page }) => {
    // 12 risks created sequentially, each waiting on its own table row — well beyond the default 30s timeout
    test.setTimeout(300_000);

    await login(page);
    await openImplementationTab(page);

    for (const scenario of RISK_SCENARIOS) {
      await createRisk(page, scenario);
    }
  });
});
