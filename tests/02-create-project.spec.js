import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test('open create project page', async ({ page }) => {
  await page.goto('https://frontv2.getlaunched.io/', {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForLoadState('networkidle');

  const createProject = page
    .getByRole('button', { name: /create project/i })
    .or(page.getByRole('link', { name: /create project/i }))
    .or(page.getByText(/create project/i));

  await expect(createProject.first()).toBeVisible({ timeout: 15000 });
  await createProject.first().click();

  await expect(page).toHaveURL('https://frontv2.getlaunched.io/project/create');
});