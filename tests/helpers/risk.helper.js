import { expect } from '@playwright/test';
import { gotoImplementation } from './navigation';
import { RISK_NAME, unique } from '../config';

export const PESTEL_CATEGORIES = ['Political', 'Economic', 'Social', 'Technological', 'Environmental', 'Legal'];

// Navigates into the bootstrapped project's Implementation section and
// clicks the "Risk analysis" tab explicitly. It's the default tab, but the
// request explicitly calls for an explicit click "to be safe" rather than
// assuming the URL alone landed on it (see navigation.js's gotoImplementation,
// which only goes to `/implementation`, not `/implementation/risk-analysis`).
export async function openRiskAnalysisTab(page, project) {
  await gotoImplementation(page, project);

  const tab = page.getByRole('tab', { name: /^risk analysis$/i }).first();
  if (await tab.isVisible().catch(() => false)) {
    await tab.click();
  }

  await expect(page.getByRole('button', { name: /create risk/i }).first()).toBeVisible({ timeout: 15000 });
}

export async function openCreateRiskModal(page) {
  const createRiskButton = page.getByRole('button', { name: /^create risk$/i }).first();
  await expect(createRiskButton).toBeVisible({ timeout: 15000 });
  await createRiskButton.click();

  const modal = page.getByRole('dialog').first();
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// Consequences and Probability both offer a "Moderate" option, and neither
// radiogroup carries an accessible name (confirmed live via an accessibility
// snapshot of the Create/Edit risk form) — so `modal.getByRole('radio', {
// name: /^Moderate$/i })` is genuinely ambiguous between the two groups and
// `.first()` silently resolves to whichever renders first, regardless of
// which field the caller meant. Scope through each field's own label
// container instead (label + radiogroup are always direct siblings under
// one wrapper) to remove the ambiguity. Note: the required-field asterisk
// ("Risk type*") only appears via a CSS `::after` pseudo-element and is not
// part of the label's actual textContent, so match on the label text alone
// (confirmed live by inspecting the rendered DOM), not the "*" suffix the
// accessibility tree/visual text shows.
function fieldContainer(modal, labelText) {
  return modal.getByText(labelText, { exact: true }).locator('..');
}

export async function setRiskType(modal, type) {
  const radio = fieldContainer(modal, 'Risk type').getByRole('radio', { name: new RegExp(`^${type}$`, 'i') }).first();
  await expect(radio).toBeVisible({ timeout: 15000 });
  await radio.click();
}

export async function setConsequences(modal, consequences) {
  const radio = fieldContainer(modal, 'Consequences')
    .getByRole('radio', { name: new RegExp(`^${consequences}$`, 'i') })
    .first();
  await expect(radio).toBeVisible({ timeout: 15000 });
  await radio.click();
}

export async function setProbability(modal, probability) {
  const radio = fieldContainer(modal, 'Probability')
    .getByRole('radio', { name: new RegExp(`^${probability}$`, 'i') })
    .first();
  await expect(radio).toBeVisible({ timeout: 15000 });
  await radio.click();
}

// PESTEL category only renders once Risk type = External is selected — the
// field container itself (and this dropdown trigger) simply doesn't exist
// in the DOM for Internal, which is exactly the show/hide behavior under test.
export function getPestelDropdown(modal) {
  return fieldContainer(modal, 'PESTEL category').locator('button[data-open="false"]').first();
}

export async function selectPestelCategory(page, modal, category) {
  const dropdownButton = getPestelDropdown(modal);
  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: category, exact: true }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();

  await expect(listbox).not.toBeVisible({ timeout: 15000 });
}

export async function fillRiskForm(page, modal, risk) {
  const nameField = modal.getByPlaceholder('Type risk name').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(risk.name);

  const descField = modal.getByPlaceholder('Write your story...').first();
  if (await descField.count()) {
    await descField.fill(risk.description);
  }

  await setRiskType(modal, risk.type);

  if (risk.type === 'External') {
    await selectPestelCategory(page, modal, risk.pestelCategory);
  }

  await setConsequences(modal, risk.consequences);
  await setProbability(modal, risk.probability);
}

export function getRiskRow(page, riskName) {
  return page.locator('tr', { hasText: riskName }).first();
}

// The Create/Edit risk modal resets its fields for another entry instead of
// auto-closing on success (confirmed live: right after "Risk created
// successfully." the dialog is still open, reset to its defaults) — close it
// explicitly so every helper leaves the caller on a clean, modal-free page
// regardless of that timing.
async function closeModalIfOpen(modal) {
  if (!(await modal.isVisible().catch(() => false))) return;

  // The freshly-added row can reflow the page (taller table, matrix
  // re-render) right as this runs, which occasionally leaves the drawer's
  // close button mid-layout-shift long enough for Playwright's normal
  // actionability wait (visible + stable) to never settle. `force: true`
  // skips that stability wait — safe here since we only care that the
  // click dispatches, not that the button is pixel-stable first — and both
  // the click and the resulting close are bounded so a stray modal never
  // hangs the whole test.
  const closeButton = modal.getByRole('button', { name: /close/i }).first();
  await closeButton.click({ timeout: 5000, force: true }).catch(() => {});
  await expect(modal).not.toBeVisible({ timeout: 15000 }).catch(() => {});
}

// Extracted from the original 20-create-risk-analysis.spec.js's inline
// createRisk() so 21 (edit) can create its own fixture risks instead of
// depending on 20 having run first.
export async function createRisk(page, project, overrides = {}) {
  const type = overrides.type || 'External';
  const risk = {
    name: overrides.name || unique(RISK_NAME),
    description: overrides.description || `${RISK_NAME}: automated regression-coverage risk record.`,
    type,
    pestelCategory: overrides.pestelCategory || (type === 'External' ? PESTEL_CATEGORIES[0] : undefined),
    consequences: overrides.consequences || 'Moderate',
    probability: overrides.probability || 'Moderate',
  };

  await openRiskAnalysisTab(page, project);
  const modal = await openCreateRiskModal(page);
  await fillRiskForm(page, modal, risk);

  const createBtn = modal.getByRole('button', { name: /^create$/i }).last();
  await expect(createBtn).toBeVisible({ timeout: 15000 });
  await createBtn.click();

  // Best-effort: the success toast is a real signal but can auto-dismiss
  // quickly, so don't fail the run on it — the row appearing below is the
  // authoritative confirmation.
  await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 15000 }).catch(() => {});

  const row = getRiskRow(page, risk.name);
  await expect(row).toBeVisible({ timeout: 20000 });

  await closeModalIfOpen(modal);

  // Risk level is computed by the app from Consequences x Probability — just
  // confirm some level got calculated, without guessing the exact matrix
  // value (documented coverage gap, see RELEASE_CHECKLIST.md §14 Edge Cases).
  await expect(row).toContainText(/low|moderate|high|extreme/i, { timeout: 15000 });

  return risk;
}

export async function openEditModalForRisk(page, riskNameSubstring) {
  const row = getRiskRow(page, riskNameSubstring);
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.scrollIntoViewIfNeeded();

  const menuButton = row.getByRole('button', { name: /open actions menu/i }).first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  const modal = page.getByRole('dialog').first();
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// Only touches the fields present in `changes`, leaving the rest of the
// pre-filled edit form untouched.
export async function applyRiskEdits(page, modal, changes) {
  if (changes.name) {
    const field = modal.getByPlaceholder('Type risk name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.name);
  }

  if (changes.description) {
    const field = modal.getByPlaceholder('Write your story...').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.description);
  }

  if (changes.type) {
    await setRiskType(modal, changes.type);
  }

  if (changes.pestelCategory) {
    await selectPestelCategory(page, modal, changes.pestelCategory);
  }

  if (changes.consequences) {
    await setConsequences(modal, changes.consequences);
  }

  if (changes.probability) {
    await setProbability(modal, changes.probability);
  }
}

export async function submitRiskUpdate(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();

  await closeModalIfOpen(modal);
}
