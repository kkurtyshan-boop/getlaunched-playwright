import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { openProject } from './helpers/navigation';

// Dashboard is read-only — no create/edit forms — so this is a rendering +
// navigation smoke spec rather than a CRUD flow.

async function openDashboard(page, project) {
  await openProject(page, project);
  await expect(page).toHaveURL(/\/dashboard/i, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible({ timeout: 15000 });
}

const WIDGETS = [
  { title: 'Products purchased by customers', hrefPattern: /\/triangle\/products$/ },
  { title: 'Financial overview', hrefPattern: /\/financial$/ },
  { title: 'Critical risk', hrefPattern: /\/implementation\/risk-analysis$/ },
  { title: 'Competitor summary', hrefPattern: /\/triangle\/competitors$/ },
  { title: 'Location Analysis', hrefPattern: /\/operations\/other$/ },
  { title: 'Supplier Analysis', hrefPattern: /\/operations\/other$/ },
  { title: 'Action plan', hrefPattern: /\/implementation\/action-plan$/ },
];

test.describe('Dashboard', () => {
  test('01. All widgets render with the project header', async ({ page, project }) => {
    await login(page);
    await openDashboard(page, project);

    // Project header
    await expect(page.getByText(project.name, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/created /i)).toBeVisible();
    await expect(page.getByRole('button', { name: /invite/i })).toBeVisible();

    for (const { title } of WIDGETS) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible({ timeout: 15000 });
    }
  });

  test('02. Each widget header link points at its module page', async ({ page, project }) => {
    await login(page);
    await openDashboard(page, project);

    for (const { title, hrefPattern } of WIDGETS) {
      const heading = page.getByRole('heading', { name: title, exact: true });
      await expect(heading).toBeVisible({ timeout: 15000 });

      const section = heading.locator('xpath=ancestor::section[1]');
      const link = section.locator('a[href]').first();

      await expect(link).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href).toMatch(hrefPattern);
    }
  });

  test('03. Invite button opens Add team members modal and closes cleanly', async ({ page, project }) => {
    await login(page);
    await openDashboard(page, project);

    await page.getByRole('button', { name: /invite/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal.getByRole('heading', { name: /add team members/i })).toBeVisible();
    await expect(modal.getByPlaceholder(/info@gmail\.com/i)).toBeVisible();

    // Role uses the app-wide custom dropdown pattern
    const roleDropdown = modal.locator('button[data-open="false"]').first();
    await expect(roleDropdown).toBeVisible();
    await roleDropdown.click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 10000 });
    await expect(listbox.getByRole('option', { name: /editor/i })).toBeVisible();
    const viewerOption = listbox.getByRole('option', { name: /viewer/i });
    await expect(viewerOption).toBeVisible();
    await viewerOption.click(); // closes the listbox by making a selection

    await expect(modal).toBeVisible();
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });
});
