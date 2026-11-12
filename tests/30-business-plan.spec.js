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

// Since 2026-11 the plan is a scrollable document (View / Edit toggle,
// Update, Download) with a "Document sections" navigation — no longer a
// slide presentation. Which sections appear depends on the project's data,
// so only the always-present core is asserted by name; every nav entry is
// then checked against a matching heading in the document itself.
const CORE_SECTIONS = ['Cover', 'Table of Contents', 'Management Summary', 'Value Proposition', /^Financials/, 'Conclusion'];

function sectionsNav(page) {
  return page.getByRole('navigation', { name: /document sections/i });
}

test.describe('Business Plan', () => {
  test('01. Generated plan renders its core sections', async ({ page, project }) => {
    test.setTimeout(60_000); // aggregates ~7 modules' data — slower than a typical page load

    await login(page);
    await openBusinessPlan(page, project);

    await expect(page.getByRole('radio', { name: /^view$/i })).toBeChecked({ timeout: 20000 });
    const nav = sectionsNav(page);
    await expect(nav).toBeVisible({ timeout: 20000 });

    for (const section of CORE_SECTIONS) {
      const name = typeof section === 'string' ? new RegExp(`^${section}$`, 'i') : section;
      await expect(nav.getByRole('button', { name })).toBeVisible({ timeout: 15000 });
    }

    // Every listed section (except the Cover, which has no heading of its
    // own) must have a matching heading in the rendered document.
    const document = page.getByRole('region', { name: /business plan/i });
    const sectionNames = (await nav.getByRole('button').allInnerTexts()).map((t) => t.trim()).filter((t) => t && !/^cover$/i.test(t));
    for (const name of sectionNames) {
      await expect(document.getByRole('heading', { name, exact: true, level: 2 }).first()).toBeAttached({ timeout: 15000 });
    }
  });

  test('02. Section navigation scrolls the document to that section', async ({ page, project }) => {
    test.setTimeout(60_000);

    await login(page);
    await openBusinessPlan(page, project);

    const nav = sectionsNav(page);
    await expect(nav).toBeVisible({ timeout: 20000 });
    const document = page.getByRole('region', { name: /business plan/i });

    const target = document.getByRole('heading', { name: 'Conclusion', exact: true, level: 2 }).first();
    await nav.getByRole('button', { name: /^conclusion$/i }).click();
    await expect(target).toBeInViewport({ timeout: 10000 });

    const back = document.getByRole('heading', { name: 'Management Summary', exact: true, level: 2 }).first();
    await nav.getByRole('button', { name: /^management summary$/i }).click();
    await expect(back).toBeInViewport({ timeout: 10000 });
  });
});
