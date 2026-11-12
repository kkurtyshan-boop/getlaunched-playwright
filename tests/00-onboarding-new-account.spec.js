import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { unique } from './config';
import { createProjectViaUi, findProjectByName, deleteProjectById, ProjectLimitReachedError } from './helpers/project';
import { createClient } from './helpers/client.helper';
import { createProduct } from './helpers/product.helper';
import { gotoProjectsList, openProject } from './helpers/navigation';

// Simulates the "brand-new account, zero projects" onboarding flow that
// tests/auth.setup.js relies on for every other spec: check projects → none
// found → create one → configure it → land on its dashboard. This exercises
// that exact bootstrap path end-to-end without depending on the account
// actually having zero projects (out of this suite's control) or requiring
// real email-verified sign-up (no mailbox API is available in this repo to
// clear that step, and re-registering per run would recreate the account
// pileup problem this suite is designed to avoid).
//
// It creates and deletes its own throwaway project — independent of the
// shared Autotest Project every other spec uses.
test.setTimeout(90_000);

test('New project onboarding: create, configure, verify, clean up', async ({ page }) => {
  await login(page);

  const projectName = unique('Onboarding Test');

  // 1. "Select a project" screen renders, "Create project" is reachable.
  await gotoProjectsList(page);
  await expect(page.getByRole('heading', { name: /select a project/i }).first()).toBeVisible({ timeout: 20000 });

  // 2. Empty-form validation — required-field errors render, then clear
  // once the form is filled in and it submits successfully.
  await page
    .getByRole('button', { name: /^create project$/i })
    .or(page.getByText(/^create project$/i))
    .first()
    .click();
  await expect(page.getByRole('heading', { name: /create project/i })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: /^create project$/i }).last().click();
  await expect(page.getByText(/must be at least 2 characters|required/i).first()).toBeVisible({ timeout: 10000 });

  // Cancel out of the invalid draft and create it properly via the shared
  // helper (mirrors this exact form).
  await page.keyboard.press('Escape').catch(() => {});

  try {
    await createProjectViaUi(page, { name: projectName });
  } catch (err) {
    if (err instanceof ProjectLimitReachedError) {
      // Confirmed real constraint on this account (canceled/expired
      // subscription caps the project count), not a test bug — see
      // helpers/project.js. Creating a throwaway project to prove the
      // onboarding flow isn't possible without freeing a slot or an active
      // subscription, and purchasing one is explicitly out of scope.
      test.skip(true, `Account is at its project limit (${err.message}) — cannot create a throwaway onboarding project without an active subscription.`);
      return;
    }
    throw err;
  }

  // 3. Resolve the new project's id (needed for direct URL navigation and
  // for cleanup) and confirm the dashboard/sidebar render for a brand-new,
  // fully empty project.
  const { id: projectId } = await findProjectByName(page, projectName);
  expect(projectId, `Could not resolve an id for newly created project "${projectName}"`).toBeTruthy();
  const project = { id: projectId, name: projectName };

  await openProject(page, project);
  // Sidebar as of 2026-11-11: Implementation was split into top-level
  // Risk analysis / Action plan entries, MVP moved under Magic triangle.
  for (const section of [/^dashboard$/i, /^magic triangle$/i, /^operations$/i, /^financial$/i, /^risk analysis$/i, /^action plan$/i, /^business plan$/i]) {
    await expect(page.getByRole('link', { name: section }).first()).toBeVisible({ timeout: 15000 });
  }

  // 4. Minimal "initial configuration" — one client, one product attached
  // to it — proving the new project is immediately usable, not just visible.
  const client = await createClient(page, project, { name: unique('Onboarding Client') });
  const product = await createProduct(page, project, {
    name: unique('Onboarding Product'),
    clientName: client.name,
  });
  expect(product.clientName).toBe(client.name);

  // 5. Clean up — this is a throwaway project for this test only.
  await deleteProjectById(page, projectId);

  await gotoProjectsList(page);
  await expect(page.locator('li').filter({ hasText: projectName })).toHaveCount(0, { timeout: 15000 });
});
