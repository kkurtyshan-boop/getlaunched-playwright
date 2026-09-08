import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, RISK_NAME } from './config';
import {
  createRisk,
  openRiskAnalysisTab,
  openEditModalForRisk,
  applyRiskEdits,
  submitRiskUpdate,
  getRiskRow,
  getPestelDropdown,
} from './helpers/risk.helper';

// Self-contained: creates its own Internal and External risks (test.describe.serial
// + `let`, per tests/07-edit-product-add-delete-client.spec.js) instead of
// depending on 20-create-risk-analysis.spec.js having run first and left
// specific risks behind.
test.describe.serial('Edit risk analysis flow', () => {
  let internalRiskName;
  let externalRiskName;

  test('00. Set up an Internal and an External risk to edit', async ({ page, project }) => {
    test.setTimeout(60_000);
    await login(page);

    const internalRisk = await createRisk(page, project, {
      name: unique(`${RISK_NAME} Edit Internal`),
      type: 'Internal',
      description: 'Internal risk created for edit-flow coverage.',
      consequences: 'Insignificant',
      probability: 'Rare',
    });
    internalRiskName = internalRisk.name;

    const externalRisk = await createRisk(page, project, {
      name: unique(`${RISK_NAME} Edit External`),
      type: 'External',
      pestelCategory: 'Economic',
      description: 'External risk created for edit-flow coverage.',
      consequences: 'Moderate',
      probability: 'Moderate',
    });
    externalRiskName = externalRisk.name;
  });

  test('01. Edit an internal risk consequences and description', async ({ page, project }) => {
    const updatedDescription = 'Internal risk: description updated by the edit-flow test.';

    await login(page);
    await openRiskAnalysisTab(page, project);
    const modal = await openEditModalForRisk(page, internalRiskName);

    await applyRiskEdits(page, modal, {
      consequences: 'Minor',
      description: updatedDescription,
    });
    await submitRiskUpdate(modal);

    const row = getRiskRow(page, internalRiskName);
    await expect(row).toContainText(updatedDescription, { timeout: 15000 });
    await expect(row).toContainText('Minor', { timeout: 15000 });
  });

  test('02. Edit an external risk probability and description', async ({ page, project }) => {
    const updatedDescription = 'External risk: description updated by the edit-flow test.';

    await login(page);
    await openRiskAnalysisTab(page, project);
    const modal = await openEditModalForRisk(page, externalRiskName);

    await applyRiskEdits(page, modal, {
      probability: 'Likely',
      description: updatedDescription,
    });
    await submitRiskUpdate(modal);

    const row = getRiskRow(page, externalRiskName);
    await expect(row).toContainText(updatedDescription, { timeout: 15000 });
    await expect(row).toContainText('Likely', { timeout: 15000 });
  });

  // Negative scenario from RELEASE_CHECKLIST.md §14: switching an existing
  // External risk (with a PESTEL category already chosen) to Internal must
  // hide/clear the now-irrelevant PESTEL value rather than submitting a
  // stale one.
  test('03. Switching an existing External risk to Internal clears the PESTEL field', async ({ page, project }) => {
    test.setTimeout(60_000);
    await login(page);

    const risk = await createRisk(page, project, {
      name: unique(`${RISK_NAME} Edit Type Switch`),
      type: 'External',
      pestelCategory: 'Legal',
      consequences: 'Moderate',
      probability: 'Moderate',
    });

    await openRiskAnalysisTab(page, project);
    const modal = await openEditModalForRisk(page, risk.name);

    const pestelDropdown = getPestelDropdown(modal);
    await expect(pestelDropdown).toBeVisible({ timeout: 15000 });

    await applyRiskEdits(page, modal, { type: 'Internal' });
    await expect(pestelDropdown).not.toBeVisible({ timeout: 15000 });

    await submitRiskUpdate(modal);

    const row = getRiskRow(page, risk.name);
    await expect(row).toContainText('Internal', { timeout: 15000 });
    await expect(row).not.toContainText('Legal', { timeout: 15000 });
  });

  test('04. Hovering a risk matrix marker shows a risk details tooltip', async ({ page, project }) => {
    await login(page);
    await openRiskAnalysisTab(page, project);

    // Risk matrix markers show a truncated fragment of the risk's own name
    // followed by a single "…" ellipsis character (confirmed live — this is
    // fixed-width truncation of the name field, not a "Internal…"/
    // "External…" type prefix as the original spec's selector assumed; that
    // only worked before because the original fixture names all happened to
    // start with the word "Internal"/"External"). The "…" character isn't
    // used anywhere else on this page, so it reliably finds *some* marker
    // without depending on any specific risk's exact name or position.
    const marker = page.getByText(/…$/).first();
    await expect(marker).toBeVisible({ timeout: 15000 });
    await marker.hover();

    const tooltip = page.getByRole('tooltip').first();
    await expect(tooltip).toBeVisible({ timeout: 15000 });
    await expect(tooltip).toContainText(/consequences/i);
    await expect(tooltip).toContainText(/probability/i);
    await expect(tooltip).toContainText(/risk level/i);
  });
});
