import { expect } from '@playwright/test';
import { escapeRegExp } from './dom';
import { gotoProducts, gotoProjectsList, gotoSignedIn } from './navigation';
import { PRODUCT_NAME } from '../config';
import {
  createProduct,
  findProductCard,
  goToAttachClientsStep,
  openEditProductModal,
  openProductDetails,
  submitProductUpdate,
} from './product.helper';

// Scenario names are capped at 50 characters by the app — keep suffixes short.
export const SCENARIO_NAME = process.env.TEST_SCENARIO_NAME || 'Autotest Scenario';
export const SCENARIO_DESCRIPTION = 'Created by the scenarios spec.';
export const DUPLICATE_NAME_ERROR = 'Another scenario of this project already has this name.';
// Last first (create preselects the first free one); no 'Dark orange' until backend dark_orange reaches staging.
export const SCENARIO_COLOR_LABELS = ['Cyan', 'Purple', 'Red', 'Orange', 'Green'];

// A scenario is a full project copy; on a populated project it takes several seconds.
const COPY_TIMEOUT = 60000;
const SWITCHER_ID = 'sidebar-scenario-switcher';

export const digits = (text) => text.replace(/\D/g, '');

export async function gotoProjectPage(page, projectId, path) {
  await gotoSignedIn(page, `/project/${projectId}${path}`);
}

// Title link name + uuid href together match the outer card, not its Base row.
export function projectCard(page, project) {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByRole('link', { name: project.name, exact: true }) })
    .filter({ has: page.locator(`a[href$="/project/${project.id}"]`) });
}

export function scenarioRow(card, name) {
  return card.getByRole('listitem').filter({ has: card.page().getByRole('link', { name, exact: true }) });
}

export function scenarioPanel(page, title) {
  return page.getByRole('dialog', { name: title });
}

export function scenarioNameField(panel) {
  return panel.getByLabel('Name', { exact: true });
}

export function scenarioAlert(page) {
  return page.getByRole('status').filter({ hasText: /You're editing/ });
}

export function colorRadio(panel, label) {
  return panel.getByRole('radiogroup', { name: 'Color' }).getByRole('radio', { name: label, exact: true });
}

export async function closeDialog(page) {
  const dialog = page.getByRole('dialog');
  const cancel = dialog.getByRole('button', { name: /^cancel$/i });
  if (await cancel.count()) await cancel.first().click();
  if (await dialog.count()) await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 });
}

async function openVisibleCard(page, project) {
  const card = projectCard(page, project);
  await expect(card).toBeVisible({ timeout: 20000 });
  return card;
}

// The app opens the new scenario's dashboard after create; returns { id, name }.
export async function createScenarioFromCard(page, project, { name, description }) {
  await gotoProjectsList(page);
  const card = await openVisibleCard(page, project);

  const addButton = card.getByRole('button', { name: /^add scenario$/i });
  await expect(addButton, 'scenario limit reached: delete leftover scenario rows on the card').toBeEnabled({
    timeout: 15000,
  });
  await addButton.click();

  const panel = scenarioPanel(page, 'New scenario');
  await expect(panel).toBeVisible({ timeout: 15000 });
  await scenarioNameField(panel).fill(name);
  await panel.getByLabel('Description', { exact: true }).fill(description);
  await panel.getByRole('button', { name: 'Create scenario' }).click();

  await expect(page).toHaveURL(/\/project\/[^/]+\/dashboard/, { timeout: COPY_TIMEOUT });
  const id = page.url().match(/\/project\/([^/?#]+)\/dashboard/)[1];
  await expect(scenarioAlert(page)).toContainText(name, { timeout: 15000 });

  return { id, name };
}

async function openScenarioRowMenu(page, project, name, action) {
  const card = await openVisibleCard(page, project);
  const row = scenarioRow(card, name);
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.getByRole('button', { name: `Scenario actions: ${name}`, exact: true }).click();

  const item = page.getByRole('menuitem', { name: new RegExp(`^${action}$`, 'i') });
  await expect(item).toBeVisible({ timeout: 15000 });
  await item.click();
}

export async function openEditScenarioPanel(page, project, name) {
  await openScenarioRowMenu(page, project, name, 'Edit');
  const panel = scenarioPanel(page, 'Edit scenario');
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(scenarioNameField(panel)).toHaveValue(name, { timeout: 15000 });
  return panel;
}

// The radio itself is sr-only; its wrapping <label> is the visible swatch.
export async function pickOtherScenarioColor(panel) {
  for (const label of SCENARIO_COLOR_LABELS) {
    const radio = colorRadio(panel, label);
    if ((await radio.getAttribute('aria-checked')) === 'true') continue;
    await radio.locator('xpath=..').click();
    await expect(radio).toBeChecked();
    return label;
  }
  throw new Error('No unselected scenario colour found.');
}

export async function saveScenarioPanel(panel) {
  await panel.getByRole('button', { name: 'Save scenario' }).click();
  await expect(panel).toBeHidden({ timeout: 15000 });
}

export async function deleteScenarioFromCard(page, project, name) {
  const row = scenarioRow(await openVisibleCard(page, project), name);
  await expect(row).toBeVisible({ timeout: 15000 });
  const id = (await row.getByRole('link').getAttribute('href')).split('/').pop();
  await openScenarioRowMenu(page, project, name, 'Delete');

  const confirm = page.getByRole('dialog', { name: 'Delete this scenario?' });
  await expect(confirm).toBeVisible({ timeout: 15000 });
  await expect(confirm).toContainText(name);
  const deleted = page.waitForResponse(
    (res) => res.request().method() === 'DELETE' && new URL(res.url()).pathname.endsWith(`/projects/${id}`),
    { timeout: 30000 }
  );
  await confirm.getByRole('button', { name: 'Yes, delete this scenario' }).click();
  expect((await deleted).ok(), `DELETE scenario "${name}"`).toBe(true);

  // The modal confirm hides the page from role queries, so the row is only checked once it closes.
  await expect(confirm).toBeHidden({ timeout: 30000 });
  await expect(scenarioRow(projectCard(page, project), name)).toHaveCount(0, { timeout: 30000 });
}

const firstLine = (error) => String(error?.message ?? error).split('\n')[0];

// Never throws: returns one message per leftover it could not delete. The Base row is excluded by its href.
export async function deleteScenariosByPrefix(page, project, prefix = SCENARIO_NAME) {
  const failures = [];
  try {
    await gotoProjectsList(page);
    const card = await openVisibleCard(page, project);
    const rows = await card
      .getByRole('listitem')
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => ({ name: link.innerText.trim(), href: link.getAttribute('href') })));
    const names = rows
      .filter((row) => !row.href?.endsWith(`/project/${project.id}`) && row.name.startsWith(`${prefix} `))
      .map((row) => row.name);
    for (const name of names) {
      try {
        await deleteScenarioFromCard(page, project, name);
      } catch (error) {
        failures.push(`${name}: ${firstLine(error)}`);
        await gotoProjectsList(page).catch(() => {});
      }
    }
  } catch (error) {
    failures.push(firstLine(error));
  }
  return failures;
}

// Caller must cancel the returned confirm: confirming deletes the whole test project.
export async function openBaseDeleteConfirm(page, project) {
  const card = await openVisibleCard(page, project);
  await card.locator('header').getByRole('button', { name: /open actions menu/i }).click();

  const item = page.getByRole('menuitem', { name: /^delete$/i });
  await expect(item).toBeVisible({ timeout: 15000 });
  await item.click();

  const confirm = page.getByRole('dialog', { name: 'Delete this project?' });
  await expect(confirm).toBeVisible({ timeout: 15000 });
  return confirm;
}

// Sidebar project plate (expanded sidebar) — toggles the group's scenario list.
export function switcherToggle(page) {
  return page.locator(`button[aria-controls="${SWITCHER_ID}"]`);
}

export async function openScenarioSwitcher(page) {
  const toggle = switcherToggle(page);
  await expect(toggle).toBeVisible({ timeout: 15000 });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();

  const list = page.locator(`#${SWITCHER_ID}`);
  await expect(list).toBeVisible({ timeout: 15000 });
  return list;
}

// An item's accessible name is the scenario name followed by its description.
export function switcherItem(list, name) {
  return list.getByRole('listitem').getByRole('button', { name: new RegExp(`^${escapeRegExp(name)}`) });
}

// Reuses an "Autotest Product ..." from earlier specs; creates one if there is none.
export async function pickProductName(page, project) {
  await gotoProducts(page, project);
  try {
    const card = await findProductCard(page, PRODUCT_NAME);
    return (await card.innerText()).trim();
  } catch {
    const product = await createProduct(page, project);
    return product.name;
  }
}

export async function readProductPrice(page, productName) {
  await openProductDetails(page, productName);
  const modal = await openEditProductModal(page);
  const price = modal.locator('#price');
  await expect(price).not.toHaveValue('', { timeout: 15000 });
  const value = await price.inputValue();
  await closeDialog(page);
  return value;
}

export async function setProductPrice(page, productName, price) {
  await openProductDetails(page, productName);
  const modal = await openEditProductModal(page);
  const priceField = modal.locator('#price');
  await expect(priceField).not.toHaveValue('', { timeout: 15000 });
  await priceField.fill(price);
  await goToAttachClientsStep(modal);
  await submitProductUpdate(modal);
}

export function diffCard(page) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: "What's different" }) });
}

export function keyFigures(page) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: 'Key figures' }) });
}
