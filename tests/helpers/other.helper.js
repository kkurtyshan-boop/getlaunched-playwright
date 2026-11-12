import { expect } from '@playwright/test';
import { gotoOperations } from './navigation';
import { escapeRegExp } from './dom';
import { LOCATION_NAME, SUPPLIER_NAME, unique } from '../config';

// Operations → Other tab (Intellectual Property Rights / Location Analysis /
// Supplier Analysis — PROJECT_KNOWLEDGE.md §3.3). `gotoOperations` lands on
// the default "Marketing channels" tab; every spec in this module needs
// "Other" instead.
export async function openOtherTab(page, project) {
  await gotoOperations(page, project);

  const otherTab = page.getByRole('tab', { name: /^other$/i }).first();
  await expect(otherTab).toBeVisible({ timeout: 15000 });
  await otherTab.click();

  await expect(page).toHaveURL(/\/operations\/other/i, { timeout: 15000 });
}

// The three "Other" accordion sections (Intellectual Property Rights /
// Location Analysis / Supplier Analysis) render their heading + description
// together as one button label, and expose a `region` with that same
// combined accessible name once expanded. Match by a heading-only regex
// (e.g. /Location Analysis/i) rather than the full combined text, since the
// description copy is incidental.
export async function expandAccordionSection(page, headingRegex) {
  const header = page.getByRole('button', { name: headingRegex }).first();
  await expect(header).toBeVisible({ timeout: 15000 });

  // Decide from the header's own aria-expanded, not from an instant
  // region-visibility check: right after navigation the region of an
  // already-open section may not have rendered yet, and clicking the header
  // then COLLAPSES it (this was the real cause of most "accordion collapsed
  // mid-flow" failures).
  if ((await header.getAttribute('aria-expanded')) !== 'true') {
    await header.click();
  }
  await expect(header).toHaveAttribute('aria-expanded', 'true', { timeout: 15000 });

  const region = page.getByRole('region', { name: headingRegex }).first();
  await expect(region).toBeVisible({ timeout: 15000 });
  return region;
}

// Same custom-dropdown pattern used app-wide (`button[data-open="false"]` →
// listbox → option), scoped to whatever container is passed in.
async function selectFromCustomDropdown(page, scope, optionLabel) {
  const dropdownButton = scope.locator('button[data-open="false"]').first();

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  // Confirmed live: right after enabling a disabled dropdown (e.g. the IP
  // Rights "Tracked" toggle swapping in the real trigger for the disabled
  // placeholder), there's a brief window where the old element is still
  // resolvable but about to be replaced — scrollIntoViewIfNeeded/click can
  // hit it mid-swap ("not attached to the DOM"). Wait for enabled+stable
  // first.
  await expect(dropdownButton).toBeEnabled({ timeout: 15000 });
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: optionLabel, exact: true }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
  await expect(listbox).not.toBeVisible({ timeout: 15000 }).catch(() => {});

  // Confirmed live (2026-08-28): the option click can register in the
  // listbox (it closes normally) without the trigger button's own displayed
  // value actually committing to "optionLabel" under fast automated
  // interaction — manually reproducing the same click sequence with human-
  // paced steps always commits correctly, so this is a render-timing race,
  // not a broken save. Verify the trigger text before returning, so a
  // silent no-op fails fast here instead of saving the previous value.
  await expect(dropdownButton).toContainText(optionLabel, { timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Intellectual Property Rights — NOT a list: one fixed record per IP type
// (Trademark / Patent / Copyright / Design), each its own panel behind a nav
// button. Redesigned 2026-11 (confirmed live 2026-11-11):
//   - Status: "Have it" / "Planned" / "Not relevant". A never-saved type
//     shows a question with "Yes, we have it" / "Yes, planned" / "Not
//     relevant" buttons; once answered it's a radiogroup.
//   - Have it → Stage* (Trademark/Design: Filed | Registered; Patent:
//     Filed | Granted; Copyright: no stage), Registration / application
//     number, Countries / regions, Filing date, Valid until, Description.
//   - Planned → Planned filing, Estimated cost, Countries / regions, Description.
//   - The nav button carries the saved stage as a badge ("Patent Filed",
//     "Trademark Not set") — always match the type by PREFIX.
//   - Switching type with unsaved edits opens a "Discard unsaved changes?"
//     dialog (Stay / Discard changes).
//   - Escape inside an open dropdown collapses the whole accordion — never
//     press Escape here.
// ---------------------------------------------------------------------------
export const IP_STATUS = { have: 'Have it', planned: 'Planned', notRelevant: 'Not relevant' };
const IP_STATUS_QUESTION_BUTTON = {
  'Have it': /^yes, we have it$/i,
  Planned: /^yes, planned$/i,
  'Not relevant': /^not relevant$/i,
};

function ipTypeButton(region, type) {
  return region.getByRole('button', { name: new RegExp(`^${escapeRegExp(type)}\\b`) }).first();
}

async function openIpTypePanel(page, type) {
  const region = await expandAccordionSection(page, /Intellectual Property Rights/i);
  await ipTypeButton(region, type).click();

  const discard = page.getByRole('button', { name: /^discard changes$/i });
  if (await discard.isVisible().catch(() => false)) {
    await discard.click();
  }
  // Panel is ready once its status controls (question buttons or radios) render.
  await expect(
    region.getByRole('radio', { name: IP_STATUS.have, exact: true }).or(region.getByRole('button', { name: /^yes, we have it$/i }))
  ).toBeVisible({ timeout: 10000 });
  return region;
}

async function setIpStatus(region, status) {
  const radio = region.getByRole('radio', { name: status, exact: true });
  if (!(await radio.isVisible().catch(() => false))) {
    await region.getByRole('button', { name: IP_STATUS_QUESTION_BUTTON[status] }).click({ timeout: 10000 });
  } else if (!(await radio.isChecked())) {
    await radio.click({ timeout: 10000 });
  }
  await expect(radio).toBeChecked({ timeout: 5000 });
}

// Saves one IP type and verifies it persisted after a reload (nav badge +
// the Stage dropdown's own value). Returns the fixture used.
//
// The IP accordion still intermittently collapses mid-interaction on the
// live project (long-standing quirk, see BUG_PATTERNS.md) — each fill
// attempt therefore re-opens the panel from scratch, bounded to 3 attempts.
export async function saveIpRight(page, project, { type, status = IP_STATUS.have, stage, registrationNumber, description } = {}) {
  await openOtherTab(page, project);

  const fillAndSave = async () => {
    const region = await openIpTypePanel(page, type);
    await setIpStatus(region, status);

    if (status === IP_STATUS.have && stage) {
      await selectFromCustomDropdown(page, region, stage);
    }
    if (status === IP_STATUS.have && registrationNumber !== undefined) {
      await region.getByRole('textbox', { name: /^registration \/ application number$/i }).fill(registrationNumber, { timeout: 10000 });
    }
    if (description !== undefined) {
      await region.getByRole('textbox', { name: /^description$/i }).fill(description, { timeout: 10000 });
    }

    const saveButton = region.getByRole('button', { name: /^save$/i });
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    // Save stays disabled when the form already matches what's stored (e.g.
    // a re-run saving "Not relevant" again) — nothing to submit then; the
    // reload check below still verifies the persisted state.
    if (await saveButton.isDisabled()) return;
    const saved = page.waitForResponse(
      (r) => /\/intellectual-properties/.test(r.url()) && r.request().method() !== 'GET',
      { timeout: 15000 }
    );
    await saveButton.click({ timeout: 10000 });
    expect((await saved).ok()).toBe(true);
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await fillAndSave();
      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      if (/Target page, context or browser has been closed/.test(err.message || '')) break;
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }
  if (lastError) throw lastError;

  // Persistence check after a reload.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  const reloaded = await openIpTypePanel(page, type);
  // Note: the reload-based assertions below only read state, so an
  // accordion collapse here just re-renders the same saved values.
  await expect(reloaded.getByRole('radio', { name: status, exact: true })).toBeChecked({ timeout: 15000 });
  if (status === IP_STATUS.have && stage) {
    await expect(ipTypeButton(reloaded, type)).toContainText(stage, { timeout: 15000 });
    await expect(reloaded.locator('button[data-open]').first()).toContainText(stage, { timeout: 15000 });
  }
  if (description !== undefined) {
    await expect(reloaded.getByRole('textbox', { name: /^description$/i })).toHaveValue(description, { timeout: 15000 });
  }

  return { type, status, stage, registrationNumber, description };
}

// ---------------------------------------------------------------------------
// Shared "items list + weighted Criteria Configuration + comparison matrix"
// shape — identical for Location Analysis and Supplier Analysis (and for
// Competitors, see helpers/evaluation.helper.js). Every helper below is
// scoped to a `region` locator (the expanded accordion section for either
// module) rather than the whole page, because both modules render a
// "Criteria Configuration" section with the exact same heading text — a
// page-wide lookup (as helpers/dom.js's openSectionCreateModal does) would
// always resolve to whichever one appears first in the DOM.
// ---------------------------------------------------------------------------

// Locations / Suppliers / Criteria Configuration each render as their own
// <section> with an <h2> heading; the create trigger is the first button
// after that heading (labeled "Add …" while empty, an unlabeled "+" icon
// once the section has items — same as helpers/dom.js openSectionCreateModal).
async function openSubsectionCreateModal(page, region, headingRegex) {
  const section = region.locator('section').filter({
    has: page.getByRole('heading', { name: headingRegex }),
  }).first();

  await expect(section).toBeVisible({ timeout: 15000 });

  const addButton = section.getByRole('heading', { name: headingRegex }).locator('xpath=following::button[1]');
  await expect(addButton).toBeVisible({ timeout: 15000 });
  await addButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// The Locations / Suppliers item lists no longer have their own heading
// (2026-11): just an "N added" counter with the "+" add button next to it,
// at the top of the module's region.
async function openItemCreateModal(page, region) {
  const addButton = region.getByText(/^\d+ added$/i).first().locator('xpath=following::button[1]');
  await expect(addButton).toBeVisible({ timeout: 15000 });
  await addButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

export async function createLocation(page, project, overrides = {}) {
  const location = {
    name: overrides.name || unique(LOCATION_NAME),
    address: overrides.address || '10 Autotest Market Street, Springfield',
  };

  await openOtherTab(page, project);

  // Same accordion-collapses-mid-interaction race confirmed for IP Rights
  // (see saveIpRight) also hits this section — bound each attempt and
  // restart from a fresh expand rather than letting one stuck click retry
  // silently for the whole test budget.
  let created = false;
  for (let attempt = 0; attempt < 2 && !created; attempt++) {
    try {
      const region = await expandAccordionSection(page, /Location Analysis/i);
      const modal = await openItemCreateModal(page, region);

      await modal.getByPlaceholder('Type name').fill(location.name);
      await modal.getByPlaceholder('Type address').fill(location.address);

      const createButton = modal.getByRole('button', { name: /^create$/i }).first();
      await expect(createButton).toBeVisible({ timeout: 15000 });
      await Promise.race([
        createButton.click({ timeout: 10000 }),
        page.waitForTimeout(10000).then(() => { throw new Error('create-location click stalled (likely accordion collapse)'); }),
      ]);

      await expect(modal).not.toBeVisible({ timeout: 15000 });
      await expect(region.getByRole('heading', { name: location.name, exact: true })).toBeVisible({ timeout: 15000 });
      created = true;
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }

  return location;
}

// Add/Edit supplier drawer (redesigned 2026-11): Supply (Name*, What they
// supply, For which products, Role Main/Backup/Interim), Volume & delivery,
// Contact details (Contact person, Phone, E-mail, Country combobox, Company
// address), Team & notes. Only Name is required.
export function supplierEmailField(modal) {
  return modal.getByRole('textbox', { name: /^e-?mail$/i });
}

export function supplierCountryField(modal) {
  return modal.getByRole('combobox', { name: /country/i }).first();
}

export async function setSupplierCountry(page, modal, country) {
  const combobox = supplierCountryField(modal);
  await combobox.click();
  await combobox.fill(country);
  await page.getByRole('option', { name: country, exact: true }).first().click();
}

export async function createSupplier(page, project, overrides = {}) {
  const supplier = {
    name: overrides.name || unique(SUPPLIER_NAME),
    email: overrides.email || 'autotest-supplier@example.com',
    country: overrides.country || 'Germany',
  };

  await openOtherTab(page, project);

  // Same accordion-collapses-mid-interaction race confirmed for IP Rights
  // and Location Analysis (see createLocation) also hits this section.
  let created = false;
  for (let attempt = 0; attempt < 2 && !created; attempt++) {
    try {
      const region = await expandAccordionSection(page, /Supplier Analysis/i);
      const modal = await openItemCreateModal(page, region);

      await modal.getByPlaceholder('Type name').fill(supplier.name);
      await supplierEmailField(modal).fill(supplier.email);
      await setSupplierCountry(page, modal, supplier.country);

      const createButton = modal.getByRole('button', { name: /^create$/i }).first();
      await expect(createButton).toBeVisible({ timeout: 15000 });
      await Promise.race([
        createButton.click({ timeout: 10000 }),
        page.waitForTimeout(10000).then(() => { throw new Error('create-supplier click stalled (likely accordion collapse)'); }),
      ]);

      await expect(modal).not.toBeVisible({ timeout: 15000 });
      await expect(region.getByRole('heading', { name: supplier.name, exact: true })).toBeVisible({ timeout: 15000 });
      created = true;
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }

  return supplier;
}

// Shared by both Location Analysis and Supplier Analysis — caller passes in
// whichever accordion `region` it already has open (see expandAccordionSection).
export async function createAnalysisCriterion(page, region, overrides = {}) {
  const criterion = {
    name: overrides.name || unique('Autotest Criterion'),
    weight: overrides.weight != null ? String(overrides.weight) : '5',
  };

  const modal = await openSubsectionCreateModal(page, region, /^Criteria Configuration$/i);
  await modal.getByPlaceholder('Type name').fill(criterion.name);

  const radio = modal.getByRole('radio', { name: criterion.weight, exact: true }).first();
  await expect(radio).toBeVisible({ timeout: 15000 });
  await radio.click();

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await expect(modal).not.toBeVisible({ timeout: 15000 });
  await expect(region.getByRole('heading', { name: criterion.name, exact: true })).toBeVisible({ timeout: 15000 });

  return criterion;
}

// Card row-actions menu (Edit/Delete) — same shape for Locations, Suppliers,
// and Criteria Configuration cards.
export async function getSubsectionCard(page, region, cardName) {
  const card = region.locator('li').filter({
    has: page.getByRole('heading', { name: cardName, exact: true }),
  }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  return card;
}

export async function openCardEditModal(page, region, cardName) {
  const card = await getSubsectionCard(page, region, cardName);
  await card.scrollIntoViewIfNeeded();

  // Location / Supplier cards (2026-11) are themselves a button that opens
  // the Edit drawer directly; Criteria Configuration cards still use an
  // "Open actions menu" → Edit menu.
  const menuButton = card.getByRole('button', { name: /open actions menu/i }).first();
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
    await expect(editItem).toBeVisible({ timeout: 15000 });
    await editItem.click();
  } else {
    await card.getByRole('button').first().click();
  }

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

export async function submitSubsectionUpdate(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
}

// ---------------------------------------------------------------------------
// Weighted comparison matrix — same math as helpers/evaluation.helper.js
// (Σ(criterion weight × cell score) / Σ(weights)), reimplemented here scoped
// to a `region` locator instead of a page-wide "evaluation matrix" heading,
// since Location Analysis and Supplier Analysis both render a "{X}
// Comparison Matrix" heading (confirmed live: "Location Comparison Matrix")
// that is NOT literally "Evaluation matrix". Scoping by region also carries
// forward the column-index-by-name lesson from evaluation.helper.js: never
// assume a fixed column index on a shared/adopted project that may already
// carry other locations/suppliers.
// ---------------------------------------------------------------------------
export async function getComparisonMatrixSection(page, region) {
  const section = region.locator('section').filter({
    has: page.getByRole('heading', { name: /comparison matrix/i }),
  }).first();

  await expect(section).toBeVisible({ timeout: 15000 });
  await section.scrollIntoViewIfNeeded();
  return section;
}

export async function getMatrixColumnIndex(page, region, itemName) {
  const matrixSection = await getComparisonMatrixSection(page, region);
  const headers = matrixSection.getByRole('columnheader');
  const count = await headers.count();

  for (let i = 0; i < count; i++) {
    const text = (await headers.nth(i).innerText()).trim();
    if (text === itemName) return i;
  }

  throw new Error(`Comparison matrix has no column header matching "${itemName}".`);
}

async function selectDropdownScore(page, trigger, score) {
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const optionByRole = listbox.getByRole('option', { name: new RegExp(`^${escapeRegExp(String(score))}$`) }).first();
  if (await optionByRole.count()) {
    await optionByRole.scrollIntoViewIfNeeded();
    await optionByRole.click();
    return;
  }

  const optionByText = listbox.getByText(new RegExp(`^${escapeRegExp(String(score))}$`), { exact: true }).first();
  await optionByText.scrollIntoViewIfNeeded();
  await optionByText.click();
}

// `columnIndex` is the absolute header index resolved via
// getMatrixColumnIndex (header 0 is always "Criteria", so row cells align
// 1:1 with header indices — no +1 offset needed; see evaluation.helper.js).
export async function setMatrixScore(page, region, criterionName, columnIndex, score) {
  const matrixSection = await getComparisonMatrixSection(page, region);

  const row = matrixSection.locator('tbody tr').filter({
    has: page.getByText(criterionName, { exact: true }),
  }).first();
  await expect(row).toBeVisible({ timeout: 15000 });

  const cell = row.locator('td').nth(columnIndex);
  const trigger = cell.locator('button').first();
  await expect(trigger).toBeVisible({ timeout: 15000 });

  await selectDropdownScore(page, trigger, score);
  await expect(trigger).toContainText(String(score), { timeout: 15000 });
}

// Recomputes the weighted average directly from every row currently in the
// table (not just this test's own rows) so the check holds regardless of
// how much unrelated history already exists on a shared/adopted project.
// Each row's label cell renders as "{name} {weight} Weight"; an unscored
// cell renders "0" and is excluded from both sums, mirroring
// evaluation.helper.js's confirmed behavior for Competitors.
export async function computeActualWeightedScore(page, region, columnIndex) {
  const matrixSection = await getComparisonMatrixSection(page, region);
  const rows = matrixSection.locator('tbody tr');
  const rowCount = await rows.count();

  let weightedSum = 0;
  let totalWeight = 0;

  for (let r = 0; r < rowCount; r++) {
    const row = rows.nth(r);
    const labelText = await row.locator('td').first().innerText();
    const weightMatch = labelText.match(/(\d+)\s*Weight/i);
    if (!weightMatch) continue;

    const scoreText = (await row.locator('td').nth(columnIndex).innerText()).trim();
    const score = Number(scoreText) || 0;
    if (score === 0) continue;

    weightedSum += Number(weightMatch[1]) * score;
    totalWeight += Number(weightMatch[1]);
  }

  return totalWeight ? weightedSum / totalWeight : 0;
}

export async function getFooterScore(page, region, columnIndex) {
  const matrixSection = await getComparisonMatrixSection(page, region);
  const footerRow = matrixSection.locator('tfoot tr').first();
  await expect(footerRow).toBeVisible({ timeout: 15000 });

  const text = (await footerRow.locator('td').nth(columnIndex).innerText()).trim();
  return Number(text);
}

// Asserts the app's displayed weighted score for one location/supplier
// column matches an independent recomputation of the same formula from
// every row/score actually visible in the table.
export async function verifyWeightedScore(page, region, itemName) {
  const columnIndex = await getMatrixColumnIndex(page, region, itemName);
  const expected = await computeActualWeightedScore(page, region, columnIndex);

  await expect
    .poll(async () => getFooterScore(page, region, columnIndex), { timeout: 15000 })
    .toBeCloseTo(expected, 1);
}
