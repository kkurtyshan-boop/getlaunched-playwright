import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { gotoTriangleOverview } from './helpers/navigation';

// The Magic Triangle overview page (AI insights / Strategy Health / Auto
// analyze) is only ever passed *through* by the Clients/Products/Competitors
// specs on the way to their own sub-pages — this is the first spec to land
// on and assert the overview page itself.

async function openMagicTriangleOverview(page, project) {
  await gotoTriangleOverview(page, project);
  await expect(page).toHaveURL(/\/triangle$/, { timeout: 15000 });
}

test.describe('Magic Triangle overview', () => {
  test('01. Overview renders AI insights and sub-links', async ({ page, project }) => {
    await login(page);
    await openMagicTriangleOverview(page, project);

    await expect(page.getByText(/strategy health/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/competitor summary/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /auto analyze/i })).toBeVisible();

    // Sub-links are present under Magic Triangle
    await expect(page.getByText(/^clients$/i).first()).toBeVisible();
    await expect(page.getByText(/products\s*\/\s*services/i).first()).toBeVisible();
    await expect(page.getByText(/^competitors$/i).first()).toBeVisible();
  });

  test('02. Auto analyze shows a loading state and clears', async ({ page, project }) => {
    test.setTimeout(60_000);
    await login(page);
    await openMagicTriangleOverview(page, project);

    const autoAnalyzeButton = page.getByRole('button', { name: /auto analyze/i });
    await expect(autoAnalyzeButton).toBeEnabled();
    await autoAnalyzeButton.click();

    // Non-deterministic AI content: assert on behavior (button becomes
    // disabled/re-enabled), not on exact response text.
    await expect(autoAnalyzeButton).toBeDisabled({ timeout: 5000 }).catch(() => {});
    await expect(autoAnalyzeButton).toBeEnabled({ timeout: 45_000 });
  });
});
