import { expect } from '@playwright/test';

export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Competitors, Evaluation criteria, Location Analysis, and Supplier Analysis
// all share the same "section with a heading + a Create button" shape (see
// PROJECT_KNOWLEDGE.md §3.2/§3.3) — one helper to open any of their Create
// modals instead of duplicating the section lookup per module.
export async function openSectionCreateModal(page, sectionTitle) {
  const section = page.locator('section').filter({
    has: page.getByRole('heading', { name: new RegExp(`^${escapeRegExp(sectionTitle)}$`, 'i') }),
  }).first();

  await expect(section).toBeVisible({ timeout: 15000 });

  const addButton = section.locator('div.pb-4 > button').first();
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
