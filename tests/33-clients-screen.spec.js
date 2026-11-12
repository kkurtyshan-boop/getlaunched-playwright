import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, CLIENT_NAME } from './config';
import { gotoClients } from './helpers/navigation';
import {
  createSegment,
  segmentCard,
  openCardMenu,
  needColumn,
  needItems,
  clickNeed,
  needCardEdit,
  needCardCanvasLink,
  clickAddNeed,
  toggleNeedList,
  coverageText,
  openCanvasLink,
  deleteSegment,
} from './helpers/client-card.helper';

const DESCRIPTION = 'Segment created by the automated clients-screen spec.';
const need = (name, priority, category) => ({ name, priority, satisfaction: 'Partially Satisfied', category });

async function closePanel(page) {
  const panel = page.getByRole('dialog');
  const cancel = panel.getByRole('button', { name: /^cancel$/i });
  if (await cancel.count()) await cancel.first().click();
  if (await panel.count()) await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0, { timeout: 15000 });
}

test.describe('Clients screen: segment cards', () => {
  let created = [];

  async function segment(page, project, suffix, needs) {
    const name = unique(`${CLIENT_NAME} ${suffix}`);
    created.push(name);
    await createSegment(page, project, { name, description: DESCRIPTION, needs });
    return segmentCard(page, name);
  }

  test.beforeEach(async ({ page }) => {
    created = [];
    await login(page);
  });

  test.afterEach(async ({ page, project }) => {
    await gotoClients(page, project);
    for (const name of created) {
      await deleteSegment(page, name);
    }
  });

  test('legend shows the four priorities', async ({ page, project }) => {
    await gotoClients(page, project);
    const legend = page.getByTestId('priority-legend');
    for (const label of ['Critical', 'High', 'Medium', 'Low']) {
      await expect(legend.getByText(label, { exact: true })).toBeVisible({ timeout: 15000 });
    }
  });

  test('card shows overview and menu opens edit and delete', async ({ page, project }) => {
    const card = await segment(page, project, 'Menu', [need('Menu pain', 'High', 'Pain')]);
    await expect(card).toContainText(DESCRIPTION);

    await openCardMenu(card, 'Edit');
    await expect(page.getByRole('dialog').getByText(/^edit client$/i).first()).toBeVisible({
      timeout: 15000,
    });
    await closePanel(page);

    await openCardMenu(card, 'Delete');
    await expect(page.getByRole('heading', { name: 'Delete this client?' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByRole('heading', { name: 'Delete this client?' })).toBeHidden({ timeout: 15000 });
    await expect(card).toBeVisible();
  });

  test('long pain list is sorted, collapsed to 4 and expandable', async ({ page, project }) => {
    const card = await segment(page, project, 'Sort', [
      need('P low', 'Low', 'Pain'),
      need('P medium', 'Medium', 'Pain'),
      need('P critical', 'Critical', 'Pain'),
      need('P high', 'High', 'Pain'),
      need('P low 2', 'Low', 'Pain'),
      need('P critical 2', 'Critical', 'Pain'),
    ]);
    const pains = needColumn(card, 'pain');

    await expect(pains.getByTestId('need-item')).toHaveCount(4);
    const visible = await needItems(pains);
    expect(visible.map((n) => n.priority)).toEqual(['critical', 'critical', 'high', 'medium']);

    await expect(pains.getByTestId('need-list-toggle')).toContainText('2 more');
    await toggleNeedList(pains);
    await expect(pains.getByTestId('need-item')).toHaveCount(6);
    await expect(pains.getByTestId('need-list-toggle')).toContainText('Show less');
    await toggleNeedList(pains);
    await expect(pains.getByTestId('need-item')).toHaveCount(4);
  });

  test('unanswered needs show No answer', async ({ page, project }) => {
    const card = await segment(page, project, 'NoAnswer', [
      need('Open job', 'High', 'Job'),
      need('Open pain', 'High', 'Pain'),
      need('Open gain', 'High', 'Gain'),
    ]);

    for (const category of ['job', 'pain', 'gain']) {
      const column = needColumn(card, category);
      await expect(column.getByTestId('need-item')).toHaveCount(1);
      await expect(column.getByText('No answer')).toHaveCount(1);
    }
  });

  test('need card shows details and links to the canvas', async ({ page, project }) => {
    const card = await segment(page, project, 'NeedCard', [
      need('Card job', 'High', 'Job'),
      need('Card pain', 'Critical', 'Pain'),
      need('Card gain', 'Low', 'Gain'),
    ]);
    const clientId = await card.getAttribute('data-client-id');

    for (const [category, name, label] of [
      ['job', 'Card job', 'Products & services'],
      ['pain', 'Card pain', 'Pain relievers'],
      ['gain', 'Card gain', 'Gain creators'],
    ]) {
      const needCard = await clickNeed(card, category, name);
      await expect(needCard).toContainText(name);
      await expect(needCard.getByText('Priority', { exact: true })).toBeVisible();
      await expect(needCard.getByText('Satisfaction level', { exact: true })).toBeVisible();
      await expect(needCard.getByText(label, { exact: true })).toBeVisible();
      await expect(needCard.getByText('No answer')).toBeVisible();
      await expect(needCardCanvasLink(page)).toHaveText('Answer in canvas');
      await page.keyboard.press('Escape');
      await expect(needCard).toBeHidden({ timeout: 15000 });
    }

    const needId = await needColumn(card, 'pain').getByTestId('need-item').first().getAttribute('data-need-id');
    await clickNeed(card, 'pain', 'Card pain');
    const link = needCardCanvasLink(page);
    await expect(link).toHaveAttribute(
      'href',
      new RegExp(`/triangle/value-proposition[?]clientId=${clientId}&needId=${needId}$`)
    );
    await link.click();
    await expect(page).toHaveURL(/\/triangle\/value-proposition\?clientId=/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/needId=/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Answer this pain reliever' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('need card Edit opens the edit panel focused on the need', async ({ page, project }) => {
    const card = await segment(page, project, 'CardEdit', [need('Edit pain', 'High', 'Pain')]);

    await clickNeed(card, 'pain', 'Edit pain');
    await needCardEdit(page).click();
    const panel = page.getByRole('dialog');
    await expect(panel.getByText('Edit', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(panel.locator('input:focus')).toHaveValue('Edit pain', { timeout: 15000 });
    await closePanel(page);
  });

  test('add buttons open the add dialog per category', async ({ page, project }) => {
    const card = await segment(page, project, 'Add', [need('Add pain', 'High', 'Pain')]);
    let panel;

    for (const [category, title, categoryLabel] of [
      ['job', 'Add job', 'Job'],
      ['pain', 'Add pain', 'Pain'],
      ['gain', 'Add gain', 'Gain'],
    ]) {
      await clickAddNeed(card, category);
      panel = page.getByRole('dialog');
      await expect(panel.getByText(title, { exact: true }).first()).toBeVisible({ timeout: 15000 });
      await expect(panel.getByRole('button', { name: /^add$/i })).toBeVisible();
      await expect(panel.getByRole('button', { name: new RegExp(`^${categoryLabel}$`, 'i') }).last()).toBeVisible();
      await closePanel(page);
    }
  });

  test('coverage footer and Open canvas link', async ({ page, project }) => {
    const card = await segment(page, project, 'Coverage', [
      need('Cov job', 'High', 'Job'),
      need('Cov pain', 'High', 'Pain'),
    ]);
    expect(await coverageText(card)).toContain('0 of 2 needs answered by your offer');

    const clientId = await card.getAttribute('data-client-id');
    await expect(openCanvasLink(card)).toHaveAttribute(
      'href',
      new RegExp(`/triangle/value-proposition\\?clientId=${clientId}$`)
    );
  });

  // A client PUT still drops answers (preflight.md) and the canvas answer panel is not driven reliably.
  test.fixme('answering a pain through the canvas raises coverage to 1 of N', async () => {});

  test('partial and empty segments', async ({ page, project }) => {
    const partial = await segment(page, project, 'Partial', [need('Only pain', 'High', 'Pain')]);
    for (const category of ['job', 'gain']) {
      const column = needColumn(partial, category);
      await expect(column.getByTestId('need-item')).toHaveCount(0);
      await expect(column.getByTestId('need-add-button')).toBeVisible();
    }
    await expect(needColumn(partial, 'pain').getByTestId('need-item')).toHaveCount(1);

    const empty = await segment(page, project, 'Empty', []);
    await expect(empty).toContainText('Add needs to see how your offer fits this segment');
  });

  test('card stacks below 1100px', async ({ page, project }) => {
    const card = await segment(page, project, 'Stack', [need('Stack pain', 'High', 'Pain')]);
    await page.setViewportSize({ width: 1024, height: 900 });

    const overview = await card.getByRole('heading').first().boundingBox();
    const boxes = [];
    for (const category of ['job', 'pain', 'gain']) {
      boxes.push(await needColumn(card, category).boundingBox());
    }

    expect(overview.y).toBeLessThan(boxes[0].y);
    expect(boxes[1].x).toBeCloseTo(boxes[0].x, 0);
    expect(boxes[2].x).toBeCloseTo(boxes[0].x, 0);
  });
});
