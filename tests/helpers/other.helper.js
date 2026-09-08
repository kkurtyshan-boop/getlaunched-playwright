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
  const region = page.getByRole('region', { name: headingRegex }).first();

  if (!(await region.isVisible().catch(() => false))) {
    const header = page.getByRole('button', { name: headingRegex }).first();
    await expect(header).toBeVisible({ timeout: 15000 });
    await header.click();
  }

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
// (Trademark / Patent / Copyright / Design), each its own panel behind a
// single-select nav button. CONFIRMED LIVE QUIRK (BUG_PATTERNS.md "IP Rights
// Nav Buttons Carry a Live Status Badge"): once a type has been saved with a
// status, its nav button label becomes "{Type} {Status}" (e.g. "Patent
// Registered") — so it must always be matched by PREFIX, never exact text.
// ---------------------------------------------------------------------------
async function openIpTypePanel(page, type) {
  await expandAccordionSection(page, /Intellectual Property Rights/i);

  const typeButton = page.getByRole('button', { name: new RegExp(`^${escapeRegExp(type)}\\b`) }).first();
  await expect(typeButton).toBeVisible({ timeout: 10000 });
  await typeButton.click();
  return typeButton;
}

// The whole "Other" accordion intermittently collapses mid-flow on this
// live/shared project — confirmed live, reproducible but NOT deterministic
// (most likely caused by another concurrent session's mutation elsewhere on
// the project invalidating this page's data and resetting local
// open/closed accordion state). `attemptFillOnce` re-opens the IP type
// panel defensively before each step; if a step still times out because the
// panel collapsed out from under it, the whole attempt is retried from
// scratch rather than leaving a half-filled form.
export async function saveIpRight(page, project, { type, tracked = true, registrationStatus, notes } = {}) {
  await openOtherTab(page, project);

  const attemptFillOnce = async () => {
    let panel = await expandAccordionSection(page, /Intellectual Property Rights/i);
    await openIpTypePanel(page, type);

    // Scope every field lookup to the IP Rights panel itself, not the whole
    // page — the page also has other custom dropdowns/switches elsewhere in
    // the sidebar/header, and a page-wide `.first()` lookup can silently
    // grab the wrong one.
    const trackedSwitch = panel.getByRole('switch').first();
    await expect(trackedSwitch).toBeVisible({ timeout: 10000 });
    const isChecked = await trackedSwitch.isChecked();
    if (Boolean(tracked) !== isChecked) {
      await trackedSwitch.click();
    }

    let notesField = panel.getByPlaceholder('Type text').first();
    if (tracked) {
      // Toggling "Tracked" on enables the registration-status dropdown and
      // the notes field together in one re-render — wait for that
      // transition to settle before touching either.
      await expect(notesField).toBeEnabled({ timeout: 10000 });
    }

    if (tracked && registrationStatus) {
      // CONFIRMED LIVE (2026-08-28): the "Intellectual Property Rights"
      // accordion can collapse mid-interaction while the Registration
      // status dropdown is being opened/selected — a real, non-
      // deterministic app race (see the class comment above; it happens on
      // some attempts and not others, unrelated to anything this helper
      // does differently between attempts). When it does, every element
      // reference captured from the pre-collapse `panel`/dropdown hangs
      // indefinitely instead of failing fast, since Playwright's actionability
      // retries have no bound on a plain `.click()`. Bound the whole
      // select-and-verify sequence in its own short timeout so a collapse
      // here fails fast into a re-expand-and-retry instead of eating the
      // rest of the test's budget.
      let selected = false;
      for (let dropdownAttempt = 0; dropdownAttempt < 2 && !selected; dropdownAttempt++) {
        try {
          await Promise.race([
            selectFromCustomDropdown(page, panel, registrationStatus),
            page.waitForTimeout(8000).then(() => { throw new Error('dropdown selection stalled (likely accordion collapse)'); }),
          ]);
          // selectFromCustomDropdown itself now verifies the trigger's
          // displayed value before resolving, so reaching here without a
          // throw already means the correct status is showing.
          selected = true;
        } catch {
          selected = false;
        }

        if (!selected) {
          panel = await expandAccordionSection(page, /Intellectual Property Rights/i);
          await openIpTypePanel(page, type);
          notesField = panel.getByPlaceholder('Type text').first();
          await expect(notesField).toBeEnabled({ timeout: 10000 });
        }
      }
      if (!selected) {
        throw new Error(`Could not select Registration status "${registrationStatus}" — accordion kept collapsing.`);
      }
    }

    if (tracked && notes !== undefined) {
      await notesField.fill(notes);
    }

    const saveButton = panel.getByRole('button', { name: /^save$/i }).first();
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await saveButton.click();
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  };

  // The "Other" accordion has been observed to intermittently collapse
  // mid-flow on this live/shared project (see comment above) — retry the
  // whole fill-and-save attempt from scratch once rather than leaving a
  // half-filled form or failing on a one-off timing glitch. Capped at 2
  // total attempts (not 3): if the browser/page itself has died (confirmed
  // live — "Target page, context or browser has been closed", a real crash,
  // not a collapse), every further attempt fails identically and just burns
  // through the test's timeout budget for no benefit.
  let lastError;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await attemptFillOnce();
      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      if (/Target page, context or browser has been closed/.test(err.message || '')) break;
    }
  }
  if (lastError) throw lastError;

  // Confirm persistence after a reload. The nav button's status badge
  // (documented in BUG_PATTERNS.md as carrying the live status, e.g.
  // "Patent Registered") is confirmed live to be unreliable here — it kept
  // showing the type's ORIGINAL status well after a successful, verified
  // (200 OK, correct payload) save, even across many reloads. The form's
  // own Registration status dropdown, reopened fresh after reload, is a
  // more direct signal of what was actually persisted, so check that
  // instead of trusting the badge text.
  if (tracked && registrationStatus) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    const panel = await expandAccordionSection(page, /Intellectual Property Rights/i);
    await openIpTypePanel(page, type);
    const dropdownButton = panel.locator('button[data-open="false"]').first();
    await expect(dropdownButton).toContainText(registrationStatus, { timeout: 15000 });
  }

  return { type, tracked: Boolean(tracked), registrationStatus, notes };
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
// <section> with an <h2> heading + an unlabeled icon-only "add" button
// (`div.pb-4 > button` — confirmed live, no accessible name to select by).
async function openSubsectionCreateModal(page, region, headingRegex) {
  const section = region.locator('section').filter({
    has: page.getByRole('heading', { name: headingRegex }),
  }).first();

  await expect(section).toBeVisible({ timeout: 15000 });

  const addButton = section.locator('div.pb-4 > button').first();
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
      const modal = await openSubsectionCreateModal(page, region, /^Locations$/i);

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
      const modal = await openSubsectionCreateModal(page, region, /^Suppliers$/i);

      await modal.getByPlaceholder('Type name').fill(supplier.name);
      await modal.getByPlaceholder('Type email').fill(supplier.email);
      await modal.getByPlaceholder('Type country').fill(supplier.country);

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

  const menuButton = card.getByRole('button', { name: /open actions menu/i }).first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

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
