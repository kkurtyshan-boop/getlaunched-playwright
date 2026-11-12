import { expect } from '@playwright/test';
import { gotoClients } from './navigation';
import { CLIENT_NAME, unique } from '../config';

// The Clients screen renders one card per segment (2026-11):
// data-testid="client-segment-card" with overview, Job/Pain/Gain need
// columns and an actions menu — see helpers/client-card.helper.js.
export function clientSegmentCard(page, name) {
  return page.getByTestId('client-segment-card').filter({ hasText: name });
}

export async function openCreateClientModal(page) {
  const button = page.getByRole('button', { name: /^create client$/i });
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });
  return modal;
}

// Each need row has three required custom dropdowns, in this order
// (confirmed live 2026-11-11):
//   Priority*           Low / Medium / High / Critical
//   Satisfaction level* Not satisfied / Partially satisfied / Fully satisfied
//   Category*           Job / Pain / Gain   (new — a need without it can't be saved)
// They're the only button[data-open] elements in the drawer, so need i's
// dropdowns are at index i*3 + {0,1,2}.
const NEED_DROPDOWNS_PER_ROW = 3;
const NEED_DROPDOWN = { priority: 0, satisfaction: 1, category: 2 };

async function selectNeedDropdown(page, modal, needIndex, field, optionName) {
  const dropdown = modal.locator('button[data-open]').nth(needIndex * NEED_DROPDOWNS_PER_ROW + NEED_DROPDOWN[field]);

  await expect(dropdown).toBeVisible({ timeout: 15000 });
  await dropdown.scrollIntoViewIfNeeded();
  await dropdown.click();

  const option = page.getByRole('listbox').last().getByRole('option', { name: new RegExp(`^${optionName}$`, 'i') });
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
}

// The "+" icon button right after the "Needs (n)" heading appends a new need row.
function addNeedRowButton(modal) {
  return modal.getByRole('heading', { name: /^needs \(\d+\)$/i }).locator('xpath=following::button[1]');
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
      await addNeedRowButton(modal).click();
    }

    const needNameField = modal.getByPlaceholder('Type need name').nth(i);
    await expect(needNameField).toBeVisible({ timeout: 15000 });
    await needNameField.fill(needs[i].name);

    await selectNeedDropdown(page, modal, i, 'priority', needs[i].priority);
    await selectNeedDropdown(page, modal, i, 'satisfaction', needs[i].satisfaction);
    await selectNeedDropdown(page, modal, i, 'category', needs[i].category || 'Job');
  }
}

// Creates a client (customer segment) via the real UI form and returns the
// fixture used, so callers (create-spec or an edit/delete-spec's own setup)
// can act on it without depending on another file having run first.
export async function createClient(page, project, overrides = {}) {
  const client = {
    name: overrides.name || unique(CLIENT_NAME),
    description: overrides.description || 'Customer segment created by the automated test suite.',
    needs: overrides.needs || [{ name: 'Autotest need', priority: 'High', satisfaction: 'Partially Satisfied', category: 'Job' }],
  };

  await gotoClients(page, project);
  const modal = await openCreateClientModal(page);
  await fillClientForm(page, modal, client);

  await modal.getByRole('button', { name: /^create$/i }).last().click();
  await expect(modal).not.toBeVisible({ timeout: 15000 });
  await expect(clientSegmentCard(page, client.name)).toBeVisible({ timeout: 15000 });

  return client;
}

// Edit client panel: deletes the i-th need row via its trash button (the
// first plain button after that row's Category dropdown — the panel has no
// data-testids) and confirms "Yes, delete this need".
export async function deleteNeedInEditPanel(page, panel, needIndex = 0) {
  const categoryLabel = panel.getByText(/^category\s*\*?$/i).nth(needIndex);
  await categoryLabel.locator('xpath=following::button[not(@data-open)][1]').click();

  const confirm = page.getByRole('button', { name: /yes, delete this need/i });
  await expect(confirm).toBeVisible({ timeout: 15000 });
  await confirm.click();
}
