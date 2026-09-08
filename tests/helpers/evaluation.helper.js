import { expect } from '@playwright/test';
import { gotoCompetitors } from './navigation';
import { openSectionCreateModal, fillFirstMatchingInput, escapeRegExp } from './dom';

export async function createEvaluationCriterion(page, project, { name, score }) {
  await gotoCompetitors(page, project);
  const modal = await openSectionCreateModal(page, 'Evaluation criteria');

  await fillFirstMatchingInput(
    modal,
    ['input[name*=".name"]', 'input[name*="name"]', 'input[placeholder*="Name"]', 'input[type="text"]'],
    name
  );

  const radio = modal.getByRole('radio', { name: new RegExp(`^${score}$`) }).first();
  await expect(radio).toBeVisible({ timeout: 15000 });
  await radio.click();

  const createButton = modal.getByRole('button', { name: /^create$/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.locator('body')).toContainText(/created|success|saved|added|updated/i, { timeout: 15000 });
}

export async function getEvaluationMatrixSection(page) {
  const section = page.locator('section').filter({
    has: page.getByRole('heading', { name: /evaluation matrix/i }),
  }).first();

  await expect(section).toBeVisible({ timeout: 15000 });
  await section.scrollIntoViewIfNeeded();
  return section;
}

// The matrix's competitor columns are NOT guaranteed to start at index 0 —
// on a shared/reused project (see helpers/project.js's leftover-project
// adoption) there can be many pre-existing competitors already occupying
// earlier columns. Column 0 is always the "Criteria" label itself, so a
// competitor's real column index has to be resolved by header text, not
// assumed by creation order.
export async function getMatrixColumnIndex(page, competitorName) {
  const matrixSection = await getEvaluationMatrixSection(page);
  const headers = matrixSection.getByRole('columnheader');
  const count = await headers.count();

  for (let i = 0; i < count; i++) {
    const text = (await headers.nth(i).innerText()).trim();
    if (text === competitorName) return i;
  }

  throw new Error(`Evaluation matrix has no column header matching "${competitorName}".`);
}

async function selectDropdownScore(page, trigger, score) {
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const listbox = page.getByRole('listbox').first();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const optionByRole = listbox.getByRole('option', { name: new RegExp(`^${escapeRegExp(String(score))}$`) }).first();
  if (await optionByRole.count()) {
    await optionByRole.scrollIntoViewIfNeeded();
    await optionByRole.click();
    return;
  }

  const optionByText = listbox.getByText(new RegExp(`^${escapeRegExp(String(score))}$`), { exact: true }).first();
  await optionByText.scrollIntoViewIfNeeded();
  await optionByText.click();
}

// `columnIndex` is the absolute header index resolved via
// getMatrixColumnIndex (header 0 is always "Criteria", so row cells align
// 1:1 with header indices — no +1 offset needed).
export async function setMatrixScore(page, criterionName, columnIndex, score) {
  const matrixSection = await getEvaluationMatrixSection(page);

  const row = matrixSection.locator('tbody tr').filter({
    has: page.getByText(criterionName, { exact: true }),
  }).first();
  await expect(row).toBeVisible({ timeout: 15000 });

  const cell = row.locator('td').nth(columnIndex);
  const trigger = cell.locator('button').first();
  await expect(trigger).toBeVisible({ timeout: 15000 });

  await selectDropdownScore(page, trigger, score);
  await expect(trigger).toContainText(String(score), { timeout: 15000 });
}

// Recomputes Σ(criterion weight × cell score) / Σ(weights) for one
// competitor column directly from every row currently in the table — not
// just the criteria this test created — so the check holds regardless of
// how much unrelated history already exists on a shared/adopted project
// (see helpers/project.js). Each row's label cell renders as
// "{name} {weight} Weight" (confirmed live). Confirmed live: a criterion
// this competitor hasn't been scored on yet renders "0" for that cell, and
// the app's own total excludes such rows entirely from the weight sum
// (rather than counting them as weight × 0) — valid scores are 1–10, so "0"
// unambiguously means "not yet scored" and is excluded here too.
export async function computeActualWeightedScore(page, columnIndex) {
  const matrixSection = await getEvaluationMatrixSection(page);
  const rows = matrixSection.locator('tbody tr');
  const rowCount = await rows.count();

  let weightedSum = 0;
  let totalWeight = 0;

  for (let r = 0; r < rowCount; r++) {
    const row = rows.nth(r);
    const labelText = await row.locator('td').first().innerText();
    const weightMatch = labelText.match(/(\d+)\s*Weight/i);
    if (!weightMatch) continue;

    const scoreText = (await row.locator('td').nth(columnIndex).innerText()).trim();
    const score = Number(scoreText) || 0;
    if (score === 0) continue;

    weightedSum += Number(weightMatch[1]) * score;
    totalWeight += Number(weightMatch[1]);
  }

  return totalWeight ? weightedSum / totalWeight : 0;
}

export async function getFooterScore(page, columnIndex) {
  const matrixSection = await getEvaluationMatrixSection(page);
  const footerRow = matrixSection.locator('tfoot tr').first();
  await expect(footerRow).toBeVisible({ timeout: 15000 });

  const text = (await footerRow.locator('td').nth(columnIndex).innerText()).trim();
  return Number(text);
}

// Asserts the app's displayed "Total weighted score" for one competitor
// column matches an independent recomputation of the same formula from
// every row/score actually visible in the table (see
// computeActualWeightedScore) — a real correctness check of the weighted-
// average math, not just that some number rendered.
export async function verifyWeightedScore(page, competitorName) {
  const columnIndex = await getMatrixColumnIndex(page, competitorName);
  const expected = await computeActualWeightedScore(page, columnIndex);

  await expect
    .poll(async () => getFooterScore(page, columnIndex), { timeout: 15000 })
    .toBeCloseTo(expected, 1);
}
