import { expect } from '@playwright/test';
import { gotoOperations } from './navigation';
import { TEAM_MEMBER_NAME, unique } from '../config';

// Operations renders Marketing channels / Team and staff / Resources / Other
// as tabs on one page (see PROJECT_KNOWLEDGE.md §3.3) — navigate via the
// `project` fixture + gotoOperations, then click into this specific tab.
export async function openTeamAndStaffTab(page, project) {
  await gotoOperations(page, project);

  const teamTab = page.getByRole('tab', { name: /team and staff/i }).first();
  await expect(teamTab).toBeVisible({ timeout: 15000 });
  await teamTab.click();
}

export async function openCreateTeamRoleModal(page) {
  const createButton = page.getByRole('button', { name: /create team role/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

// The app-wide custom dropdown pattern (CLAUDE.md "Selectors & waits"):
// button[data-open="false"] -> listbox -> option. Waits for the listbox to
// actually close before returning — without this, a dropdown opened moments
// later in the same modal can race against this one's still-closing listbox
// (see product.helper.js's selectFromCustomDropdown for the same fix).
export async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel) {
  const dropdownButton = scope.locator('button[data-open="false"]').nth(dropdownIndex);

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: optionLabel, exact: true }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();

  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});
}

// Start year's dropdown options track the project's live planning horizon
// (e.g. "2034"/"2035" on the bootstrapped Autotest Project today), not the
// static CALC_START_YEAR documented in config.js (confirmed drifted — see
// lesson 4 / BUG_PATTERNS.md's guidance on stale documented option labels).
// Selects `preferredLabel` if it's actually present in the list, otherwise
// falls back to whichever option renders first, and returns the label that
// was actually selected so callers can assert against the real value.
export async function selectAvailableOption(page, scope, dropdownIndex, preferredLabel) {
  const dropdownButton = scope.locator('button[data-open="false"]').nth(dropdownIndex);

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  let option = preferredLabel
    ? listbox.getByRole('option', { name: preferredLabel, exact: true }).first()
    : listbox.getByRole('option').first();

  if (!(await option.count())) {
    option = listbox.getByRole('option').first();
  }

  await expect(option).toBeVisible({ timeout: 15000 });
  const selectedLabel = (await option.innerText()).trim();
  await option.click();

  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  return selectedLabel;
}

export async function getTeamRoleCard(page, cardText) {
  const card = page.locator('li').filter({ hasText: cardText }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  return card;
}

export async function openEditModalForRole(page, cardText) {
  const card = await getTeamRoleCard(page, cardText);
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

// The Edit team role form does NOT pre-fill "Presence of the importance,%"
// from the existing record (confirmed live: reopening Edit on a freshly
// created role shows this field empty even though it was set to a real
// value at creation) — leaving it untouched and clicking Update then fails
// with "Engagement percent must be a number". Every edit must therefore
// (re)supply a value for this field regardless of what else is being
// changed; callers should call this right after opening the edit modal.
//
// Handles both form shapes (see createTeamMember): the old flat "Engagement
// %" field, and the newer per-planning-horizon-year "Employment*" section
// (each row's input has no placeholder — anchored on its "%" sibling label,
// same technique as createTeamMember).
export async function ensureEngagementPercent(modal, value) {
  const field = modal.getByPlaceholder(/type engagement percent/i).first();
  if (await field.isVisible().catch(() => false)) {
    await field.fill(value);
    return;
  }

  const employmentInputs = modal.getByText('%', { exact: true }).locator('xpath=preceding-sibling::input[1]');
  const count = await employmentInputs.count();
  for (let i = 0; i < count; i++) {
    await employmentInputs.nth(i).fill(value);
  }
}

export async function submitTeamRoleUpdate(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();

  // The modal closing is a far more specific success signal than a loose
  // body-text match (lesson 2) — the list already contains words like
  // "updated"/"saved" in unrelated copy.
  await expect(modal).not.toBeVisible({ timeout: 15000 });
}

// Creates one Team and staff record via the real "Create team role" modal's
// radio toggle and returns the fixture used (plus `cardText`, the substring
// that identifies this record's card in the combined list: "First Last" for
// a Key member, the role name for Line staff).
//
// overrides.type: 'key' (default) | 'line'.
//
// CONFIRMED LIVE BUG (2026-08-24): Line staff ('line') submission is
// currently rejected unconditionally by the API with a 422 —
// "The staffing.0.employment_percent field is required when staffing is
// present. (and 1 more error)" — regardless of which values are chosen for
// any other field. Verified via a direct network probe against
// POST /api/v1/projects/{id}/team-members: the frontend sends the single
// "Presence of the importance,%" field as a top-level `engagement_percent`,
// but never copies it into each `staffing[]` row as `employment_percent`,
// while "Quantity per year" (which populates `staffing`) is itself a
// required client-side field ("Staffing is required" if left blank) — so
// there is no way to submit a Line staff record through the UI today.
// Reproduced 3x with different role name/employment type/period/salary
// combinations and both fill orders (percent-before-quantity and
// quantity-before-percent); the request payload was byte-identical in
// shape every time, confirming this is a frontend serialization bug, not a
// timing/automation issue. This function's Line staff branch is written
// against the documented/intended UI contract so it will work the moment
// this is fixed — see tests/14-create-team-and-staff.spec.js and
// tests/15-edit-team-and-staff.spec.js, which currently `test.skip()` their
// Line staff coverage citing this same bug.
export async function createTeamMember(page, project, overrides = {}) {
  const type = overrides.type || 'key';

  await openTeamAndStaffTab(page, project);
  const modal = await openCreateTeamRoleModal(page);

  const member = {
    type,
    firstName: overrides.firstName || 'QA',
    lastName: overrides.lastName || unique(TEAM_MEMBER_NAME),
    roleName: overrides.roleName || unique(`${TEAM_MEMBER_NAME} Role`),
    background: overrides.background || 'Key member created by the automated test suite.',
    description: overrides.description || 'Line staff role created by the automated test suite.',
    importancePercent: overrides.importancePercent || '50',
    employmentType: overrides.employmentType || 'Full time',
    salary: overrides.salary || '5000',
    period: overrides.period || 'Monthly',
  };

  if (type === 'line') {
    const lineStaffRadio = modal.getByRole('radio', { name: /line staff/i }).first();
    await expect(lineStaffRadio).toBeVisible({ timeout: 15000 });
    await lineStaffRadio.click();

    const roleNameField = modal.getByPlaceholder('Type role name').first();
    await expect(roleNameField).toBeVisible({ timeout: 15000 });
    await roleNameField.fill(member.roleName);

    // One input per planning-horizon year — don't hardcode a count, fill
    // however many render (same pattern as product.helper.js's
    // attachClientToProduct).
    const qtyInputs = modal.getByPlaceholder(/type quantity/i);
    const qtyCount = await qtyInputs.count();
    const quantities = overrides.quantities || Array.from({ length: qtyCount }, (_, i) => String(20 + i * 5));
    member.quantities = quantities;
    for (let i = 0; i < qtyCount; i++) {
      await qtyInputs.nth(i).fill(quantities[i] ?? quantities[quantities.length - 1]);
    }
  } else {
    const firstNameField = modal.getByPlaceholder('Type first name').first();
    await expect(firstNameField).toBeVisible({ timeout: 15000 });
    await firstNameField.fill(member.firstName);

    const lastNameField = modal.getByPlaceholder('Type last name').first();
    await expect(lastNameField).toBeVisible({ timeout: 15000 });
    await lastNameField.fill(member.lastName);

    const backgroundField = modal.getByPlaceholder('Write your story...').first();
    await expect(backgroundField).toBeVisible({ timeout: 15000 });
    await backgroundField.fill(member.background);

    const roleNameField = modal.getByPlaceholder('Type role name').first();
    await expect(roleNameField).toBeVisible({ timeout: 15000 });
    await roleNameField.fill(member.roleName);
  }

  // Confirmed live (2026-08-27) on a different environment/account: the
  // single flat "Engagement %" field plus separate Employment Type / Pay
  // period / Start year dropdowns have been replaced by one "Employment*"
  // section with a per-planning-horizon-year percentage input (same "one
  // input per year" pattern as Line Staff's Quantity per year / Resources'
  // Cost per year). These inputs render with no placeholder/accessible name
  // — unlike every other field in this form — so they're matched by that
  // absence. Falls back to the old single-field + dropdowns shape if it's
  // still present (e.g. an environment that hasn't shipped this change).
  const importanceField = modal.getByPlaceholder(/type engagement percent/i).first();
  if (await importanceField.isVisible().catch(() => false)) {
    await importanceField.fill(member.importancePercent);
    await selectFromCustomDropdown(page, modal, 0, member.employmentType);
  }

  const salaryField = modal.getByPlaceholder(/type salary/i).first();
  await expect(salaryField).toBeVisible({ timeout: 15000 });
  await salaryField.fill(member.salary);

  if (await importanceField.isVisible().catch(() => false)) {
    await selectFromCustomDropdown(page, modal, 1, member.period);
    member.startYear = await selectAvailableOption(page, modal, 2, overrides.startYear);
  } else {
    // Each per-year row renders as [year label, input, "%" label] siblings
    // with no placeholder/accessible name on the input itself, so anchor on
    // the "%" label (an exact, unambiguous leaf) and take its immediate
    // preceding-sibling input — robust to however many wrapper levels sit
    // between this row and the "Employment*" heading (a fixed ancestor
    // depth guess proved wrong: it silently matched zero elements and let
    // Create submit with Employment still unset).
    const employmentInputs = modal.getByText('%', { exact: true }).locator('xpath=preceding-sibling::input[1]');
    const employmentCount = await employmentInputs.count();
    const employmentPercents = overrides.employmentPercents
      || Array.from({ length: employmentCount }, () => member.importancePercent);
    for (let i = 0; i < employmentCount; i++) {
      await employmentInputs.nth(i).fill(employmentPercents[i] ?? employmentPercents[employmentPercents.length - 1]);
    }
    member.employmentPercents = employmentPercents;
  }

  if (type === 'line') {
    const descriptionField = modal.getByPlaceholder('Write your story...').first();
    await expect(descriptionField).toBeVisible({ timeout: 15000 });
    await descriptionField.fill(member.description);
  }

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await expect(modal).not.toBeVisible({ timeout: 15000 });

  member.cardText = type === 'line' ? member.roleName : `${member.firstName} ${member.lastName}`;

  return member;
}
