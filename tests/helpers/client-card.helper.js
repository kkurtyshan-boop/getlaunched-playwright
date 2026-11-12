import { expect } from '@playwright/test';
import { gotoClients } from './navigation';
import { openCreateClientModal, fillClientForm, clientSegmentCard } from './client.helper';

export function segmentCard(page, name) {
  return clientSegmentCard(page, name);
}

// Creates a segment through the shared client form filler (Priority,
// Satisfaction level and Category for every need).
export async function createSegment(page, project, { name, description, needs = [] }) {
  await gotoClients(page, project);
  const modal = await openCreateClientModal(page);
  await fillClientForm(page, modal, { name, description, needs });

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
