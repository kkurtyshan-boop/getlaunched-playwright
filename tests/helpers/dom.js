import { expect } from '@playwright/test';

export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Competitors, Evaluation criteria, Location Analysis, and Supplier Analysis
// all share the same "section with a heading + a Create button" shape (see
// PROJECT_KNOWLEDGE.md §3.2/§3.3) — one helper to open any of their Create
// modals instead of duplicating the section lookup per module.
export async function openSectionCreateModal(page, sectionTitle) {
  const titleRegex = new RegExp(`^${escapeRegExp(sectionTitle)}$`, 'i');
  const section = page.locator('section').filter({ has: page.getByRole('heading', { name: titleRegex }) }).first();

  await expect(section).toBeVisible({ timeout: 15000 });

  // The create trigger is the first button after the section heading: a
  // labeled "Add competitor" / "Add criterion" button while the section is
  // empty, an unlabeled "+" icon button once it has items (2026-11-11).
  // No stable hook exists for the icon variant — worth requesting a
  // data-testid from the app team.
  const addButton = section.getByRole('heading', { name: titleRegex }).locator('xpath=following::button[1]');
  await expect(addButton).toBeVisible({ timeout: 15000 });
  await addButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

export async function getSection(page, sectionTitle) {
  const section = page.locator('section').filter({
    has: page.getByRole('heading', { name: new RegExp(sectionTitle, 'i') }),
  }).first();
  await expect(section).toBeVisible({ timeout: 15000 });
  return section;
}

// Submits an empty create form and asserts a validation message appears —
// shared by every "Create" negative-path test across the weighted-matrix
// modules (Competitors, Evaluation criteria, Location/Supplier Analysis).
export async function assertEmptyFormValidation(modal) {
  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await expect(modal).toBeVisible({ timeout: 5000 });

  const validationMessage = modal.locator('text=/required|invalid|error|please fill|must/i').first();
  await expect(validationMessage).toBeVisible({ timeout: 5000 });
}

export async function fillFirstMatchingInput(modal, selectors, value) {
  for (const selector of selectors) {
    const field = modal.locator(selector).first();
    if (await field.count()) {
      await expect(field).toBeVisible({ timeout: 15000 });
      await field.fill(value);
      return;
    }
  }
  throw new Error(`Could not find input for value: ${value}`);
}

// Generic form-field version of the app-wide custom dropdown pattern
// (button[data-open] → listbox → option), located by the field's visible
// label instead of a positional index — e.g.
//   selectDropdownByLabel(page, form, /^legal form/i, 'Sole Proprietorship')
// The trigger is the first button[data-open] that follows the label in DOM
// order, which holds for every labeled dropdown in the app's forms.
export async function selectDropdownByLabel(page, scope, label, optionName) {
  const labelEl = scope.getByText(label).first();
  await expect(labelEl).toBeVisible({ timeout: 15000 });

  const trigger = labelEl.locator('xpath=following::button[@data-open][1]');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });
  const option = optionName === undefined
    ? listbox.getByRole('option').first()
    : listbox.getByRole('option', { name: optionName, exact: true });
  await option.click();
  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});
}
