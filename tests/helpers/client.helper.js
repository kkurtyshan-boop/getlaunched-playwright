import { expect } from '@playwright/test';
import { gotoClients } from './navigation';
import { CLIENT_NAME, unique } from '../config';

export async function openCreateClientModal(page) {
  const button = page.getByRole('button', { name: /^create client$/i });
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// Priority/Satisfaction dropdowns inside a "need" row — same
// button[data-open]→listbox→option pattern as everywhere else, scoped to
// the row via its "Type need name" input.
async function selectNeedDropdown(page, modal, needIndex, isSecond, optionName) {
  const needNameInput = modal.getByPlaceholder('Type need name').nth(needIndex);
  const needBlock = needNameInput.locator('xpath=ancestor::div[contains(@class, "flex")]');
  const selectButtons = needBlock.getByRole('button').filter({ hasText: 'Select' });
  const dropdown = selectButtons.nth(isSecond ? 1 : 0);

  await expect(dropdown).toBeVisible({ timeout: 15000 });
  await dropdown.scrollIntoViewIfNeeded();
  await dropdown.click();

  const option = page.getByRole('option', { name: new RegExp(optionName, 'i') });
  await expect(option.first()).toBeVisible({ timeout: 15000 });
  await option.first().click();
}

export async function fillClientForm(page, modal, { name, description, needs = [] }) {
  const nameField = modal.getByPlaceholder('Type client name').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(name);

  const descriptionField = modal.getByPlaceholder('Write your story...').first();
  await expect(descriptionField).toBeVisible({ timeout: 15000 });
  await descriptionField.fill(description);

  for (let i = 0; i < needs.length; i++) {
    if (i === 0) {
      await modal.getByRole('button', { name: /Add needs/i }).click();
    } else {
      await modal.locator('button.text-primary:has(svg)').last().click();
    }

    const needNameField = modal.getByPlaceholder('Type need name').nth(i);
    await expect(needNameField).toBeVisible({ timeout: 15000 });
    await needNameField.fill(needs[i].name);

    await selectNeedDropdown(page, modal, i, false, needs[i].priority);
    await selectNeedDropdown(page, modal, i, true, needs[i].satisfaction);
  }
}

// Creates a client (customer segment) via the real UI form and returns the
// fixture used, so callers (create-spec or an edit/delete-spec's own setup)
// can act on it without depending on another file having run first.
export async function createClient(page, project, overrides = {}) {
  const client = {
    name: overrides.name || unique(CLIENT_NAME),
    description: overrides.description || 'Customer segment created by the automated test suite.',
    needs: overrides.needs || [{ name: 'Autotest need', priority: 'High', satisfaction: 'Partially Satisfied' }],
  };

  await gotoClients(page, project);
  const modal = await openCreateClientModal(page);
  await fillClientForm(page, modal, client);

  await modal.getByRole('button', { name: /^create$/i }).last().click();
  await expect(page.locator('body')).toContainText(client.name, { timeout: 15000 });

  return client;
}
