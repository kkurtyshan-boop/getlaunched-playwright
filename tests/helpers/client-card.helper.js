import { expect } from '@playwright/test';
import { gotoClients } from './navigation';
import { openCreateClientModal } from './client.helper';

const SELECT_INDEX = { priority: 0, satisfaction: 2, category: 4 };

// Each select renders two buttons, hence the step of 2.
async function pickNeedSelect(page, row, field, optionName) {
  const trigger = row.getByRole('button').nth(SELECT_INDEX[field]);
  await expect(trigger).toBeVisible({ timeout: 15000 });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const option = page.getByRole('option', { name: new RegExp(`^${optionName}`, 'i') });
  await expect(option.first()).toBeVisible({ timeout: 15000 });
  await option.first().click();
}

export function segmentCard(page, name) {
  return page.getByTestId('client-segment-card').filter({ hasText: name });
}

// Sets Category on every need too: the form requires it, createClient does not.
export async function createSegment(page, project, { name, description, needs = [] }) {
  await gotoClients(page, project);
  const modal = await openCreateClientModal(page);

  await modal.getByPlaceholder('Type client name').first().fill(name);
  await modal.getByPlaceholder('Write your story...').first().fill(description);

  for (let i = 0; i < needs.length; i++) {
    if (i === 0) {
      await modal.getByRole('button', { name: /Add needs/i }).click();
    } else {
      await modal.locator('button.text-primary:has(svg)').last().click();
    }

    const nameField = modal.getByPlaceholder('Type need name').nth(i);
    await expect(nameField).toBeVisible({ timeout: 15000 });
    await nameField.fill(needs[i].name);

    const row = nameField.locator('xpath=ancestor::div[contains(@class, "grid-cols-2")][1]');
    await pickNeedSelect(page, row, 'priority', needs[i].priority);
    await pickNeedSelect(page, row, 'satisfaction', needs[i].satisfaction);
    await pickNeedSelect(page, row, 'category', needs[i].category);
  }

  await modal.getByRole('button', { name: /^create$/i }).last().click();
  await expect(segmentCard(page, name)).toBeVisible({ timeout: 15000 });
}

export async function openCardMenu(card, action) {
  await card.getByTestId('segment-menu-trigger').getByRole('button', { name: /open actions menu/i }).click();
  const item = card.page().getByRole('menuitem', { name: new RegExp(`^${action}$`, 'i') });
  await expect(item).toBeVisible({ timeout: 15000 });
  await item.click();
}

export function needColumn(card, category) {
  return card.locator(`[data-testid="need-column"][data-category="${category}"]`);
}

export async function needItems(column) {
  return column.getByTestId('need-item').evaluateAll((els) =>
    els.map((el) => ({
      name: el.textContent.replace(/No answer/i, '').trim(),
      priority: el.getAttribute('data-priority'),
      answered: el.getAttribute('data-answered') === 'true',
    }))
  );
}

export async function clickNeed(card, category, name) {
  await needColumn(card, category).getByTestId('need-item').filter({ hasText: name }).first().click();
  const needCard = card.page().getByTestId('need-card');
  await expect(needCard).toBeVisible({ timeout: 15000 });
  return needCard;
}

export function needCardEdit(page) {
  return page.getByTestId('need-card').getByTestId('need-card-edit');
}

export function needCardCanvasLink(page) {
  return page.getByTestId('need-card').getByTestId('need-card-canvas');
}

export async function clickAddNeed(card, category) {
  await needColumn(card, category).getByTestId('need-add-button').click();
}

export async function toggleNeedList(column) {
  await column.getByTestId('need-list-toggle').click();
}

export async function coverageText(card) {
  return (await card.getByTestId('coverage-footer').innerText()).replace(/\s+/g, ' ').trim();
}

export function openCanvasLink(card) {
  return card.getByRole('link', { name: /open canvas/i });
}

export async function deleteSegment(page, name) {
  const card = segmentCard(page, name);
  if ((await card.count()) === 0) return;
  await openCardMenu(card, 'Delete');
  await page.getByRole('button', { name: /yes, delete this client/i }).click();
  await expect(segmentCard(page, name)).toHaveCount(0, { timeout: 15000 });
}
