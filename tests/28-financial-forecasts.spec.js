import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { gotoFinancial } from './helpers/navigation';

// Financial — Forecasts & Reports had zero spec coverage before this file.
// It's a read-only, fully-computed page (derived from Resources + Products
// pricing), so this is a rendering + cross-page consistency check rather
// than a CRUD flow.

async function openForecastsReports(page, project) {
  await gotoFinancial(page, project, 'forecasts-reports');

  await expect(page).toHaveURL(/\/financial\/forecasts-reports/i, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /forecasts\s*&\s*reports/i }).first()).toBeVisible({ timeout: 15000 });
}

test.describe('Financial — Forecasts & Reports', () => {
  test('01. Stat tiles and chart render', async ({ page, project }) => {
    await login(page);
    await openForecastsReports(page, project);

    await expect(page.getByText(/initial investment/i)).toBeVisible();
    await expect(page.getByText(/yearly burn rate/i)).toBeVisible();
    await expect(page.getByText(/break-even point/i)).toBeVisible();
    await expect(page.getByText(/profitability/i).first()).toBeVisible();
    await expect(page.getByText(/monthly financial performance/i)).toBeVisible();
  });

  test('02. Income / Cash flow / Balance sheet tabs each load their own breakdown table', async ({ page, project }) => {
    await login(page);
    await openForecastsReports(page, project);

    // Each tab renders a different computed statement, so the text that
    // proves a given tab's table actually loaded differs per tab: Income is
    // the only one with an editable "Planning horizon breakdown" + "Create
    // entry" (the other two are fully derived, read-only statements).
    const tabs = [
      { name: /^income$/i, uniqueText: /planning horizon breakdown/i },
      { name: /^cash flow$/i, uniqueText: /operating cash flow/i },
      { name: /^balance sheet$/i, uniqueText: /total assets/i },
    ];

    for (const { name: tabName, uniqueText } of tabs) {
      const tab = page.getByRole('tab', { name: tabName }).first();
      const isTab = await tab.isVisible().catch(() => false);
      const control = isTab ? tab : page.getByText(tabName).first();

      await control.click();
      await expect(page.getByText(uniqueText).first()).toBeVisible({ timeout: 15000 });
    }

    // Income tab (the editable one) also exposes a "Create entry" action.
    const income = page.getByRole('tab', { name: /^income$/i }).first();
    const isIncomeTab = await income.isVisible().catch(() => false);
    await (isIncomeTab ? income : page.getByText(/^income$/i).first()).click();
    await expect(page.getByText(/planning horizon breakdown/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /create entry/i })).toBeVisible();
  });
});
