import { expect } from '@playwright/test';
import { gotoCompetitors } from './navigation';
import { openSectionCreateModal, fillFirstMatchingInput, escapeRegExp } from './dom';
import { COMPETITOR_NAME, unique } from '../config';

export async function selectCompetitorType(page, modal, type) {
  const selectButton = modal.getByRole('button', { name: /^select$/i }).first();
  await expect(selectButton).toBeVisible({ timeout: 15000 });
  await selectButton.click();

  const optionByRole = page.getByRole('option', { name: new RegExp(`^${escapeRegExp(type)}$`, 'i') }).first();
  if (await optionByRole.count()) {
    await expect(optionByRole).toBeVisible({ timeout: 15000 });
    await optionByRole.click();
    return;
  }

  const optionByText = page.getByText(new RegExp(`^${escapeRegExp(type)}$`, 'i')).first();
  await expect(optionByText).toBeVisible({ timeout: 15000 });
  await optionByText.click();
}

export async function createCompetitor(page, project, overrides = {}) {
  const competitor = {
    name: overrides.name || unique(COMPETITOR_NAME),
    url: overrides.url || 'https://autotest-competitor.example.com',
    type: overrides.type || 'Direct',
  };

  await gotoCompetitors(page, project);
  const modal = await openSectionCreateModal(page, 'Competitors');

  await fillFirstMatchingInput(
    modal,
    ['input[name*=".name"]', 'input[name*="name"]', 'input[placeholder*="Name"]', 'input[type="text"]'],
    competitor.name
  );
  await fillFirstMatchingInput(
    modal,
    ['input[name*=".url"]', 'input[name*="url"]', 'input[name*="website"]', 'input[placeholder*="URL"]', 'input[placeholder*="Website"]', 'input[type="url"]'],
    competitor.url
  );
  await selectCompetitorType(page, modal, competitor.type);

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.locator('body')).toContainText(/created|success|saved|added|updated/i, { timeout: 15000 });

  return competitor;
}

export async function getCompetitorRow(page, competitorName) {
  const safeName = escapeRegExp(competitorName);
  const competitorsSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: /^competitors$/i }),
  }).first();

  await expect(competitorsSection).toBeVisible({ timeout: 15000 });

  const row = competitorsSection.locator('li').filter({
    has: page.getByRole('heading', { name: new RegExp(`^${safeName}$`, 'i') }),
  }).first();

  if (await row.count()) {
    await expect(row).toBeVisible({ timeout: 15000 });
    return row;
  }

  const fallbackRow = competitorsSection.locator('li').filter({
    has: page.getByText(new RegExp(`^${safeName}$`, 'i')),
  }).first();
  await expect(fallbackRow).toBeVisible({ timeout: 15000 });
  return fallbackRow;
}

async function openRowActionsMenu(page, competitorName) {
  const row = await getCompetitorRow(page, competitorName);
  const menuButton = row.locator('button[aria-label="Open actions menu"]').first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();
  return row;
}

export async function editCompetitorName(page, competitorName, updatedName) {
  await openRowActionsMenu(page, competitorName);

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  const nameInput = modal.locator('input').first();
  await expect(nameInput).toBeVisible({ timeout: 15000 });
  await nameInput.fill(updatedName);

  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.locator('body')).toContainText(updatedName, { timeout: 15000 });
}

export async function deleteCompetitor(page, competitorName) {
  await openRowActionsMenu(page, competitorName);

  const deleteItem = page.getByRole('menuitem', { name: /^delete$/i }).first();
  await expect(deleteItem).toBeVisible({ timeout: 15000 });
  await deleteItem.click();

  const confirmDeleteButton = page.getByRole('button', { name: /yes, delete this competitor/i });
  await expect(confirmDeleteButton).toBeVisible({ timeout: 15000 });
  await confirmDeleteButton.click();

  await expect(page.getByText(/item deleted successfully/i)).toBeVisible({ timeout: 15000 });

  const competitorsSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: /^competitors$/i }),
  }).first();
  await expect(competitorsSection.locator(`h3[title="${competitorName}"]`)).toHaveCount(0, { timeout: 15000 });
}
