import { expect } from '@playwright/test';
import { gotoOperations } from './navigation';
import { RESOURCE_NAME, unique } from '../config';

// Operations is a tabbed page (see PROJECT_KNOWLEDGE.md §3.3): Marketing
// channels (default) / Team and staff / Resources / Other. Land on
// Operations, then click into the Resources tab.
export async function openResourcesTab(page, project) {
  await gotoOperations(page, project);
  await expect(page.getByRole('heading', { name: /^operations$/i }).first()).toBeVisible({ timeout: 15000 });

  const resourcesTab = page.getByRole('tab', { name: /^resources$/i }).first();
  await expect(resourcesTab).toBeVisible({ timeout: 15000 });
  await resourcesTab.click();
}

// List-level filter — "Investments" / "Running costs". Despite the
// role="radio" markup this is actually a Radix ToggleGroup (confirmed live
// 2026-08-24: `data-slot="toggle-group"` on the container), which toggles
// the current selection OFF (falling back to the other option) if you
// click an already-selected item rather than being a no-op like a real
// radio. Skip the click entirely when the target is already selected.
export async function switchResourceListTab(page, tabLabel) {
  const radio = page.getByRole('radio', { name: tabLabel, exact: true }).first();
  await expect(radio).toBeVisible({ timeout: 15000 });

  const isChecked = await radio.getAttribute('aria-checked');
  if (isChecked === 'true') return;

  await radio.click();
}

export async function openCreateResourceModal(page) {
  const createButton = page.getByRole('button', { name: /create new resource/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// The create modal's own radio toggle — defaults to Investment; switch to
// Running costs. Wait for the "Cost per year" inputs (the concrete signal
// the form has re-rendered) instead of a fixed sleep.
export async function switchToRunningCostsInModal(page, modal) {
  const runningCostsRadio = modal.getByRole('radio', { name: /running costs/i }).first();
  await expect(runningCostsRadio).toBeVisible({ timeout: 15000 });
  await runningCostsRadio.click();

  await expect(modal.getByPlaceholder(/type cost/i).first()).toBeVisible({ timeout: 5000 });
}

// The app-wide custom dropdown pattern (CLAUDE.md "Selectors & waits"):
// button[data-open="false"] -> listbox -> option. `dropdownIndex` picks
// which dropdown within `scope` (Category=0, Payment type=1, Start year=2 —
// confirmed live 2026-08-24; unchanged from the app-wide convention even
// though the Cost fields around them have changed shape, see below).
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

  // Wait for the listbox to actually close before the next dropdown is
  // opened — otherwise a still-closing listbox can be matched by the next
  // `getByRole('listbox').last()` call.
  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});
}

// Same dropdown pattern, but selects by on-screen position instead of a
// known label and returns the option's text. Used for Start year: this
// shared "Autotest Project" may have been adopted/renamed from a
// pre-existing leftover project (see helpers/project.js ensureTestProject)
// rather than freshly bootstrapped with tests/config.js's
// FOUNDATION_YEAR/CALC_START_YEAR, so its actual Start year options
// (confirmed live: "2034"/"2035", not config's 2027/2028) can't be assumed
// — always discover them live instead of hardcoding a year value.
export async function selectDropdownOptionByIndex(page, scope, dropdownIndex, optionIndex) {
  const dropdownButton = scope.locator('button[data-open="false"]').nth(dropdownIndex);
  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option').nth(optionIndex);
  await expect(option).toBeVisible({ timeout: 15000 });
  const label = (await option.textContent()).trim();
  await option.click();

  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  return label;
}

// Reads the planning-horizon year label for each "Cost per year" input.
// Confirmed live (2026-08-24): each input's immediately preceding sibling
// element is the plain-text year label (e.g. "2034") — there is no
// accessible name/label association, so this is the only reliable way to
// know which calendar year a given column represents.
async function getCostColumnYear(costInput) {
  const label = await costInput.locator('xpath=preceding-sibling::*[1]').textContent();
  return parseInt(label.trim(), 10);
}

// Fills the "Cost per year" inputs, skipping any column whose year is
// before the resource's own Start year — that combination is rejected by
// validation (toast: "Yearly cost years must not be earlier than the
// resource start year."; see BUG_PATTERNS.md "Resources — Running Cost
// Rejected for Years Before Start Year"). Confirmed live 2026-08-24 that
// this rule now applies to Investment resources too, not just Running
// costs — the two types share the exact same Cost-per-year field shape;
// the only remaining difference is the Payment type dropdown.
export async function fillResourceCostPerYear(modal, resource) {
  const startYearNum = parseInt(resource.startYear, 10);
  const costInputs = modal.getByPlaceholder(/type cost/i);
  const costCount = await costInputs.count();
  const costsPerYear = resource.costsPerYear || Array.from({ length: costCount }, () => '10000');

  for (let i = 0; i < costCount; i++) {
    const input = costInputs.nth(i);
    const columnYear = await getCostColumnYear(input);
    if (columnYear < startYearNum) continue;
    if (costsPerYear[i] === undefined) continue;
    await input.fill(costsPerYear[i]);
  }
}

// Shared create-form filler. As of 2026-11-11 the two types differ again:
//   Investment    — Resource name, Category, Payment type (disabled, fixed
//                   "One-time payment"), Year, Useful life (years, default
//                   5 — depreciation period), Investment amount, Description
//   Running costs — Resource name, Category, Payment type (Monthly /
//                   Annually), Start year, Cost per year (one input per
//                   planning-horizon year), Description
// In both, the year dropdown is the 3rd button[data-open] (Category=0,
// Payment type=1, Year/Start year=2).
export async function fillResourceForm(page, modal, resource) {
  const nameField = modal.getByPlaceholder('Type resource name').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(resource.name);

  await selectFromCustomDropdown(page, modal, 0, resource.category);

  if (resource.type === 'running') {
    await selectFromCustomDropdown(page, modal, 1, resource.paymentType);
  }

  // Start year must be selected before filling Cost per year, since the
  // fill step needs to know which columns to skip.
  resource.startYear = await selectDropdownOptionByIndex(page, modal, 2, resource.startYearIndex ?? 0);

  if (resource.type === 'running') {
    await fillResourceCostPerYear(modal, resource);
  } else {
    await fillInvestmentFields(modal, resource);
  }

  const descriptionField = modal.getByPlaceholder('Write your story...').first();
  await expect(descriptionField).toBeVisible({ timeout: 15000 });
  await descriptionField.fill(resource.description);
}

export function investmentAmountField(modal) {
  return modal.getByRole('textbox', { name: /^investment amount/i });
}

export function usefulLifeField(modal) {
  return modal.getByRole('textbox', { name: /^useful life/i });
}

async function fillInvestmentFields(modal, { investmentAmount, usefulLife }) {
  if (usefulLife !== undefined) {
    await usefulLifeField(modal).fill(usefulLife);
  }
  if (investmentAmount !== undefined) {
    await investmentAmountField(modal).fill(investmentAmount);
  }
}

// Raw "Create" click with no success assertion — used both by the
// happy-path helper below (which does assert success) and by boundary
// tests that deliberately expect the modal to stay open (validation
// rejection).
export async function clickCreateButton(modal) {
  const button = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();
}

export async function updateResourceForm(modal) {
  const button = modal.getByRole('button', { name: /^update$/i }).first();
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();
  await expect(modal).not.toBeVisible({ timeout: 15000 });
}

export async function getResourceRow(page, resourceName) {
  const row = page.locator('tr').filter({ hasText: resourceName }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  return row;
}

export async function openEditModalForResource(page, resourceName) {
  const row = await getResourceRow(page, resourceName);
  await row.scrollIntoViewIfNeeded();

  const menuButton = row.getByRole('button', { name: /open actions menu/i }).first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// Only touches the fields present in `changes`, leaving the rest of the
// pre-filled edit form untouched. Field positions match the create form —
// the Edit modal has no Investment/Running costs radio (type is fixed once
// created) but is otherwise the same layout.
export async function applyResourceEdits(page, modal, changes) {
  if (changes.name) {
    const field = modal.getByPlaceholder('Type resource name').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.name);
  }

  if (changes.category) {
    await selectFromCustomDropdown(page, modal, 0, changes.category);
  }

  if (changes.paymentType) {
    await selectFromCustomDropdown(page, modal, 1, changes.paymentType);
  }

  if (changes.startYearIndex !== undefined) {
    changes.startYear = await selectDropdownOptionByIndex(page, modal, 2, changes.startYearIndex);
  }

  await fillInvestmentFields(modal, changes);

  if (changes.costsPerYear) {
    // If Start year wasn't also being changed, read it back from the
    // already-selected (pre-filled) Start year button so the before-start
    // skip rule can still be honored.
    if (!changes.startYear) {
      const startYearButton = modal.locator('button[data-open="false"]').nth(2);
      changes.startYear = (await startYearButton.textContent()).trim();
    }
    await fillResourceCostPerYear(modal, changes);
  }

  if (changes.description) {
    const field = modal.getByPlaceholder('Write your story...').first();
    await expect(field).toBeVisible({ timeout: 15000 });
    await field.fill(changes.description);
  }
}

// Creates a resource (Investment or Running costs) via the real UI form and
// returns the fixture used, so callers (create-spec or an edit-spec's own
// setup) never depend on another file having run first. Verifies the new
// row is visible in its own list view before returning (lesson: match by
// unique name, never by position/count — the shared project already has
// accumulated data).
export async function createResource(page, project, overrides = {}) {
  const type = overrides.type === 'running' ? 'running' : 'investment';

  await openResourcesTab(page, project);

  // Pick the list filter first: "Create new resource" then opens the drawer
  // already in that mode. Switching Investment → Running costs INSIDE the
  // drawer leaves an empty yearly_costs[0] entry behind (from the Investment
  // amount field) that silently fails validation — see BUG_PATTERNS.md
  // "Running-Cost Resources Cannot Be Created". The list-first path is what
  // a user naturally does and works.
  await switchResourceListTab(page, type === 'running' ? 'Running costs' : 'Investments');
  const modal = await openCreateResourceModal(page);
  await expect(modal.getByRole('radio', { name: type === 'running' ? /running costs/i : /^investment$/i })).toBeChecked({ timeout: 10000 });

  const resource = {
    type,
    name: overrides.name || unique(RESOURCE_NAME),
    category: overrides.category || (type === 'running' ? 'Goods and Materials' : 'Equipment'),
    paymentType: overrides.paymentType || 'Monthly',
    costsPerYear: overrides.costsPerYear,
    investmentAmount: type === 'investment' ? overrides.investmentAmount || '10000' : undefined,
    usefulLife: type === 'investment' ? overrides.usefulLife : undefined,
    startYearIndex: overrides.startYearIndex ?? 0,
    description:
      overrides.description ||
      `${type === 'running' ? 'Running cost' : 'Investment'} resource created by the automated test suite.`,
  };

  await fillResourceForm(page, modal, resource);
  // fillResourceForm mutates resource.startYear with the real selected label.

  await clickCreateButton(modal);
  await expect(modal).not.toBeVisible({ timeout: 15000 });

  await switchResourceListTab(page, type === 'running' ? 'Running costs' : 'Investments');
  await getResourceRow(page, resource.name);

  return resource;
}
