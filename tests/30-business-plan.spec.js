import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { gotoBusinessPlan } from './helpers/navigation';

// Business Plan had zero spec coverage before this file. It's a read-only,
// auto-generated document that aggregates nearly every module — a good
// end-to-end smoke test, not a place to assert exact figures (those are
// covered at their source modules).

async function openBusinessPlan(page, project) {
  await gotoBusinessPlan(page, project);
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  await expect(page).toHaveURL(/\/business-plan/i, { timeout: 20000 });
}

test.describe('Business Plan', () => {
  test('01. Generated plan renders its major sections', async ({ page, project }) => {
    test.setTimeout(60_000); // aggregates ~7 modules' data — slower than a typical page load

    await login(page);
    await openBusinessPlan(page, project);

    // Section list reflects the aggregate document's actual table of
    // contents (structural headings), not any project's specific business
    // content — verified against the live rendering rather than assumed.
    for (const sectionName of [
      /clients/i,
      /products\s*&\s*services/i,
      /competitive analysis/i,
      /go-to-market/i,
      /team/i,
      /location analysis/i,
      /supplier analysis/i,
      /financials/i,
      /risk analysis/i,
      /action plan/i,
    ]) {
      await expect(page.getByText(sectionName).first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('02. Next slide control advances the presentation', async ({ page, project }) => {
    test.setTimeout(60_000);

    await login(page);
    await openBusinessPlan(page, project);

    const nextSlideButton = page.getByRole('button', { name: /next slide/i }).first();
    await expect(nextSlideButton).toBeVisible({ timeout: 15000 });

    const before = await page.locator('main').innerText();
    await nextSlideButton.click();
    await page.waitForTimeout(500);
    const after = await page.locator('main').innerText();

    expect(after).not.toEqual(before);
  });
});
