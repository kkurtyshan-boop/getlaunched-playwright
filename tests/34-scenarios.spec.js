import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique } from './config';
import {
  gotoProjectsList,
  openProject,
  gotoClients,
  gotoOperations,
  gotoFinancial,
  gotoProducts,
} from './helpers/navigation';
import {
  SCENARIO_NAME,
  SCENARIO_DESCRIPTION,
  DUPLICATE_NAME_ERROR,
  digits,
  gotoProjectPage,
  projectCard,
  scenarioRow,
  scenarioNameField,
  scenarioAlert,
  colorRadio,
  closeDialog,
  createScenarioFromCard,
  openEditScenarioPanel,
  pickOtherScenarioColor,
  saveScenarioPanel,
  deleteScenarioFromCard,
  deleteScenariosByPrefix,
  openBaseDeleteConfirm,
  switcherToggle,
  openScenarioSwitcher,
  switcherItem,
  pickProductName,
  readProductPrice,
  setProductPrice,
  diffCard,
  keyFigures,
} from './helpers/scenario.helper';

const COPY_TEST_TIMEOUT = 120_000;
const PRODUCT_TEST_TIMEOUT = 180_000;

const SHARED_TEXT_FIELDS = ['Domicil', 'Currency'];
const SHARED_SELECT_FIELDS = ['Legal form', 'Year of foundation', 'Start calculation from', 'Planning years'];

function sharedTextField(page, label) {
  return page.getByText(label, { exact: true }).locator('xpath=..').getByRole('combobox');
}

function sharedSelect(page, label) {
  return page.getByText(label, { exact: true }).locator('xpath=..').locator('button[data-open]');
}

test.describe('Project scenarios', () => {
  // Covers the hooks too: login plus a sweep that may delete several leftover scenarios.
  test.describe.configure({ timeout: COPY_TEST_TIMEOUT });

  async function scenario(page, project, suffix) {
    const name = unique(`${SCENARIO_NAME} ${suffix}`);
    return createScenarioFromCard(page, project, { name, description: SCENARIO_DESCRIPTION });
  }

  // Every name this spec creates starts with SCENARIO_NAME, so the sweep also catches a broken earlier run.
  async function sweepScenarios(page, project) {
    for (const description of await deleteScenariosByPrefix(page, project)) {
      test.info().annotations.push({ type: 'scenario cleanup failed', description });
    }
  }

  async function expectOnBase(page, project) {
    await expect(switcherToggle(page)).toContainText(project.name, { timeout: 15000 });
    await expect(scenarioAlert(page)).toHaveCount(0);
  }

  test.beforeEach(async ({ page, project }) => {
    await login(page);
    await sweepScenarios(page, project);
  });

  test.afterEach(async ({ page, project }) => {
    await sweepScenarios(page, project);
  });

  test('create from the project card opens the scenario with its alert', async ({ page, project }) => {
    const { id, name } = await scenario(page, project, 'Create');

    await expect(page).toHaveURL(new RegExp(`/project/${id}/dashboard`));
    const alert = scenarioAlert(page);
    await expect(alert).toContainText(`You're editing ${name} — changes don't affect Base.`);
    await expect(alert).toContainText(SCENARIO_DESCRIPTION);
    await expect(alert.getByRole('button', { name: 'Back to Base' })).toBeVisible();
    await expect(alert.getByRole('button', { name: 'Compare with Base' })).toBeVisible();

    await gotoProjectsList(page);
    await expect(scenarioRow(projectCard(page, project), name)).toBeVisible({ timeout: 15000 });
  });

  test('alert shows on every scenario page and not on the Base', async ({ page, project }) => {
    const copy = await scenario(page, project, 'Alert');

    for (const [label, visit] of [
      ['dashboard', openProject],
      ['clients', gotoClients],
      ['operations', gotoOperations],
      ['forecasts', (p, s) => gotoFinancial(p, s, 'forecasts-reports')],
    ]) {
      await visit(page, copy);
      await expect(scenarioAlert(page), `alert on ${label}`).toContainText(copy.name, { timeout: 15000 });
    }

    await openProject(page, project);
    await expectOnBase(page, project);
    await gotoClients(page, project);
    await expectOnBase(page, project);
  });

  test('a price change in the scenario leaves the Base product untouched', async ({ page, project }) => {
    test.setTimeout(PRODUCT_TEST_TIMEOUT);
    const productName = await pickProductName(page, project);
    const copy = await scenario(page, project, 'Iso');

    await gotoProducts(page, copy);
    const oldPrice = await readProductPrice(page, productName);
    const newPrice = digits(oldPrice).startsWith('7777') ? '8888' : '7777';
    await setProductPrice(page, productName, newPrice);
    expect(digits(await readProductPrice(page, productName))).toMatch(new RegExp(`^${newPrice}0*$`));

    await scenarioAlert(page).getByRole('button', { name: 'Back to Base' }).click();
    await expect(page).toHaveURL(new RegExp(`/project/${project.id}/triangle/products`), { timeout: 15000 });
    await expectOnBase(page, project);
    expect(digits(await readProductPrice(page, productName))).toBe(digits(oldPrice));
  });

  test('sidebar switcher lists the group and keeps the current page', async ({ page, project }) => {
    const { id, name } = await scenario(page, project, 'Switch');

    await gotoProjectPage(page, id, '/operations/resources');
    let list = await openScenarioSwitcher(page);
    await expect(switcherItem(list, name)).toHaveAttribute('aria-current', 'true');
    await expect(switcherItem(list, 'Base')).not.toHaveAttribute('aria-current', 'true');
    await expect(list.getByRole('button', { name: /^add scenario$/i })).toBeVisible();
    await expect(list.getByRole('link', { name: /^compare scenarios$/i })).toBeVisible();

    await switcherItem(list, 'Base').click();
    await expect(page).toHaveURL(new RegExp(`/project/${project.id}/operations/resources`), { timeout: 15000 });
    await expectOnBase(page, project);

    list = await openScenarioSwitcher(page);
    await expect(switcherItem(list, 'Base')).toHaveAttribute('aria-current', 'true');
    await expect(switcherItem(list, name)).not.toHaveAttribute('aria-current', 'true');
    await switcherItem(list, name).click();
    await expect(page).toHaveURL(new RegExp(`/project/${id}/operations/resources`), { timeout: 15000 });
    await expect(scenarioAlert(page)).toContainText(name, { timeout: 15000 });
  });

  test('shared settings are locked on the scenario edit page', async ({ page, project }) => {
    const { id } = await scenario(page, project, 'Shared');
    const hint = page.getByText('Shared by all scenarios. Change it in Base.');

    await gotoProjectPage(page, id, '/edit');
    await expect(hint).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel(/^project name/i)).toBeDisabled();
    for (const label of SHARED_TEXT_FIELDS) {
      await expect(sharedTextField(page, label), label).toBeDisabled();
    }
    for (const label of SHARED_SELECT_FIELDS) {
      await expect(sharedSelect(page, label), label).toBeDisabled();
    }

    await gotoProjectPage(page, project.id, '/edit');
    await expect(page.getByLabel(/^project name/i)).toHaveValue(project.name, { timeout: 15000 });
    await expect(page.getByLabel(/^project name/i)).toBeEnabled();
    await expect(sharedSelect(page, 'Year of foundation')).toBeEnabled();
    await expect(hint).toHaveCount(0);
  });

  test('edit renames and recolours; a duplicate name is rejected', async ({ page, project }) => {
    const { id, name } = await scenario(page, project, 'Edit');
    const renamed = unique(`${SCENARIO_NAME} Renamed`);

    await gotoProjectsList(page);
    const card = projectCard(page, project);
    let panel = await openEditScenarioPanel(page, project, name);
    await scenarioNameField(panel).fill(renamed);
    const color = await pickOtherScenarioColor(panel);
    await saveScenarioPanel(panel);
    await expect(scenarioRow(card, renamed)).toBeVisible({ timeout: 15000 });
    await expect(scenarioRow(card, name)).toHaveCount(0);
    // Counted before the modal panel opens: it hides the card from role queries.
    const rows = await card.getByRole('listitem').count();

    panel = await openEditScenarioPanel(page, project, renamed);
    await expect(colorRadio(panel, color)).toBeChecked();
    await scenarioNameField(panel).fill('Base');
    await panel.getByRole('button', { name: 'Save scenario' }).click();
    await expect(panel.getByRole('alert').filter({ hasText: DUPLICATE_NAME_ERROR })).toBeVisible({ timeout: 15000 });
    await expect(panel).toBeVisible();
    await closeDialog(page);
    await expect(scenarioRow(card, renamed)).toBeVisible();
    await expect(card.getByRole('listitem')).toHaveCount(rows);

    await scenarioRow(card, renamed).getByRole('link', { name: renamed, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/project/${id}`), { timeout: 15000 });
    await expect(scenarioAlert(page)).toContainText(`You're editing ${renamed}`, { timeout: 15000 });
    const list = await openScenarioSwitcher(page);
    await expect(switcherItem(list, renamed)).toHaveAttribute('aria-current', 'true');
  });

  test('compare screen opens from the alert with chips, tabs and key figures', async ({ page, project }) => {
    const { id, name } = await scenario(page, project, 'Compare');

    await scenarioAlert(page).getByRole('button', { name: 'Compare with Base' }).click();
    await expect(page).toHaveURL(new RegExp(`/project/${id}/scenarios/compare`), { timeout: 15000 });

    const chips = page.getByRole('group', { name: 'Compare scenarios' });
    await expect(chips.getByRole('button', { name: 'Base', exact: true })).toHaveAttribute('aria-pressed', 'true', {
      timeout: 15000,
    });
    await expect(chips.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');

    const chart = page.getByRole('tabpanel').locator('[data-slot="chart"]');
    await expect(page.getByRole('tab', { name: 'Revenue' })).toHaveAttribute('aria-selected', 'true');
    await expect(chart).toBeVisible({ timeout: 30000 });

    for (const [tabName, metric] of [
      ['Net profit', 'net_profit'],
      ['Cash', 'cash'],
    ]) {
      await page.getByRole('tab', { name: tabName }).click();
      await expect(page.getByRole('tab', { name: tabName })).toHaveAttribute('aria-selected', 'true');
      await expect(page).toHaveURL(new RegExp(`metric=${metric}`));
      await expect(chart).toBeVisible({ timeout: 30000 });
    }

    const table = keyFigures(page).getByRole('table');
    await expect(table).toBeVisible({ timeout: 30000 });
    await expect(table.getByRole('columnheader', { name: 'Base', exact: true })).toBeVisible();
    await expect(table.getByRole('columnheader', { name, exact: true })).toBeVisible();
    await expect(table.getByRole('rowheader', { name: 'Lowest cash' })).toBeVisible();
  });

  // The diff endpoint is not deployed on staging yet.
  test.fixme("What's different lists a changed product price", async ({ page, project }) => {
    test.setTimeout(PRODUCT_TEST_TIMEOUT);
    const productName = await pickProductName(page, project);
    const copy = await scenario(page, project, 'Diff');

    await gotoProducts(page, copy);
    const oldPrice = await readProductPrice(page, productName);
    await setProductPrice(page, productName, digits(oldPrice).startsWith('7777') ? '8888' : '7777');

    await gotoProjectPage(page, copy.id, '/scenarios/compare');
    const diff = diffCard(page);
    await expect(diff.getByText(/^\d+ changes? in .+ compared with Base$/)).toBeVisible({ timeout: 30000 });
    await expect(diff.getByRole('listitem').first()).toBeVisible();
  });

  // The insight endpoint is not deployed on staging yet, and every run spends AI credits.
  test.fixme('AI summary row shows a generated text', async ({ page, project }) => {
    const copy = await scenario(page, project, 'AI');

    await gotoProjectPage(page, copy.id, '/scenarios/compare');
    const insight = page.getByRole('region', { name: 'AI summary' });
    await expect(insight).toBeVisible({ timeout: 30000 });
    await expect(insight).toHaveAttribute('aria-busy', 'false', { timeout: 60000 });
    await expect(insight).toHaveText(/\S/);
  });

  test('delete removes the scenario; the Base delete confirm is only cancelled', async ({ page, project }) => {
    const { name } = await scenario(page, project, 'Delete');

    await gotoProjectsList(page);
    const card = projectCard(page, project);
    await expect(scenarioRow(card, name)).toBeVisible({ timeout: 15000 });

    const baseConfirm = await openBaseDeleteConfirm(page, project);
    await expect(baseConfirm).toContainText(/This also deletes its \d+ scenarios?\./);
    await baseConfirm.getByRole('button', { name: /^cancel$/i }).click();
    await expect(baseConfirm).toBeHidden({ timeout: 15000 });
    await expect(card).toBeVisible();

    await deleteScenarioFromCard(page, project, name);
    await expect(card).toBeVisible();
  });
});
