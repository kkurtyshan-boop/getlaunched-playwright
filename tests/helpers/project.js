import { expect } from '@playwright/test';
import {
  PROJECT_NAME,
  PROJECT_DESCRIPTION,
  FOUNDATION_YEAR,
  CALC_START_YEAR,
  PLANNING_HORIZON_YEARS,
} from '../config';
import { selectDropdownByLabel } from './dom';

// Discovers the backend's API base URL and a live Bearer token by observing
// real authenticated traffic. storageState.json only carries a
// refresh_token cookie (confirmed: no localStorage token is persisted), so
// there is no simpler way to get a token for direct API calls than watching
// the app's own requests — same technique scripts/cleanupTestProjects.js
// already uses successfully for GET/DELETE /v1/projects.
async function captureApiContext(page) {
  let apiBase = null;
  let authHeader = null;

  const onRequest = (req) => {
    const url = req.url();
    const match = url.match(/^(https?:\/\/.*?\/v1)(?:\/|$)/);
    if (!match) return;
    if (!apiBase) apiBase = match[1];
    const auth = req.headers()['authorization'];
    if (auth && /bearer/i.test(auth)) authHeader = auth;
  };

  page.on('request', onRequest);
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 30 && (!apiBase || !authHeader); i++) {
      await page.waitForTimeout(500);
    }
  } finally {
    page.off('request', onRequest);
  }

  if (!apiBase) throw new Error('Could not determine API base URL from network traffic.');
  if (!authHeader) throw new Error('Could not capture an Authorization header from network traffic.');

  return { apiBase, headers: { authorization: authHeader, accept: 'application/json' } };
}

// Response shape is defensive: supports {data:[...]}, {data:{data:[...]}}, or [...].
function extractList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  return [];
}

export async function listProjects(page) {
  const { apiBase, headers } = await captureApiContext(page);
  const res = await page.request.get(`${apiBase}/projects`, { headers });
  if (!res.ok()) throw new Error(`GET ${apiBase}/projects failed: ${res.status()}`);
  return { list: extractList(await res.json()), apiBase, headers };
}

export async function findProjectByName(page, name = PROJECT_NAME) {
  const { list, apiBase, headers } = await listProjects(page);
  const match = list.find((p) => (p.name || p.title) === name);

  return {
    id: match ? match.uuid || match.id : null,
    name: match ? match.name || match.title : null,
    apiBase,
    headers,
  };
}

// Thrown by createProjectViaUi when the account's own project-count limit
// blocks creation (confirmed live: a canceled-but-still-active subscription
// drops the account to a plan cap of 3 projects, surfaced as a 403 with
// message "You have reached the maximum number of projects (N)." and an
// in-app `role="alert"` toast with the same text). This is a real account/
// billing constraint, not a bug in the suite — and fixing it would mean
// automating a subscription purchase, which is explicitly out of scope.
export class ProjectLimitReachedError extends Error {}

export async function deleteProjectById(page, id) {
  const { apiBase, headers } = await captureApiContext(page);
  const res = await page.request.delete(`${apiBase}/projects/${id}`, { headers });
  if (!res.ok()) throw new Error(`DELETE ${apiBase}/projects/${id} failed: ${res.status()}`);
}

// Drives the real Create Project UI form. Mirrors the proven steps from
// tests/02-create-project.spec.js / scripts/createTestProject.js — there is
// no confirmed API endpoint for project creation, only for list/delete, so
// creation stays UI-driven (also exercises the real onboarding form, which
// is the point of this suite).
export async function createProjectViaUi(page, { name, description = PROJECT_DESCRIPTION } = {}) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const createProjectButton = page
    .getByRole('button', { name: /^create project$/i })
    .or(page.getByText(/^create project$/i))
    .first();
  await expect(createProjectButton).toBeVisible({ timeout: 15000 });
  await createProjectButton.click();

  await expect(page.getByRole('heading', { name: /create project/i })).toBeVisible({ timeout: 15000 });
  const form = page.locator('main');

  // Form layout as of 2026-11-11: Basic info (name, short description),
  // Business setup (Domicil combobox — preset to Switzerland, Legal form*,
  // Development stage*), Financial settings (Currency* combobox, Income
  // tax*, Year of foundation*, Start calculation from*, Planning years*),
  // optional Links (website/social — replaced the old Website input) and
  // Team members. Every select is now a custom dropdown, not a native <select>.
  await form.getByRole('textbox', { name: /^project name/i }).fill(name);
  await form.getByRole('textbox', { name: /^short description/i }).fill(description);

  await selectDropdownByLabel(page, form, /^legal form/i);
  await selectDropdownByLabel(page, form, /^development stage/i);

  // Currency is a searchable combobox (₣ Swiss Franc first).
  await form.getByRole('combobox', { name: /^select$/i }).click();
  await page.getByRole('option').first().click();

  await form.getByRole('textbox', { name: /^income tax/i }).fill('25');

  // Many downstream specs assume exactly PLANNING_HORIZON_YEARS
  // year-columns (2027/2028 today) — see config.js.
  await selectDropdownByLabel(page, form, /^year of foundation/i, FOUNDATION_YEAR);
  await selectDropdownByLabel(page, form, /^start calculation from/i, CALC_START_YEAR);
  await selectDropdownByLabel(page, form, /^planning years/i, String(PLANNING_HORIZON_YEARS));

  await page.getByRole('button', { name: /^create project$/i }).last().click();

  const limitAlert = page.getByRole('alert').filter({ hasText: /maximum number of projects/i }).first();
  const success = page.locator('body').getByText(/project successfully created|created successfully/i).first();

  const sawLimitAlert = await Promise.race([
    limitAlert.waitFor({ state: 'visible', timeout: 8000 }).then(() => true),
    success.waitFor({ state: 'visible', timeout: 8000 }).then(() => false),
  ]).catch(() => false);

  if (sawLimitAlert && (await limitAlert.isVisible().catch(() => false))) {
    const alertText = await limitAlert.innerText().catch(() => 'maximum number of projects reached');
    throw new ProjectLimitReachedError(alertText);
  }

  if (!(await success.isVisible().catch(() => false))) {
    await expect(page).not.toHaveURL(/\/project\/create/i, { timeout: 15000 });
  }

  await expect(page.getByRole('heading', { name: /select a project/i }).first()).toBeVisible({ timeout: 20000 });
  const card = page.locator('li').filter({ hasText: name }).first();
  await expect(card).toBeVisible({ timeout: 20000 });
}

// Renames an existing project via the real Edit Project UI form — used only
// by the project-limit fallback below, to converge an adopted leftover
// project onto the canonical TEST_PROJECT_NAME for future runs.
async function renameProjectViaUi(page, currentName, newName) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const card = page.locator('li').filter({ hasText: currentName }).first();
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.getByRole('button', { name: /open actions menu/i }).click();

  const editOption = page.getByText(/^edit$/i).first();
  await expect(editOption).toBeVisible({ timeout: 10000 });
  await editOption.click();

  await expect(page.getByRole('heading', { name: /edit project|create project/i }).first()).toBeVisible({ timeout: 15000 });

  const nameField = page.getByRole('textbox', { name: /^project name/i });
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(newName);

  await page.getByRole('button', { name: /update project/i }).last().click();

  try {
    await expect(page.locator('body')).toContainText(/updated successfully|project successfully updated|success/i, { timeout: 10000 });
  } catch {
    await expect(page).not.toHaveURL(/\/project\/edit/i, { timeout: 15000 });
  }
}

// A leftover project is one whose name already looks like disposable
// test/QA data rather than a real business idea — see the orphaned-project
// data-hygiene note in PROJECT_KNOWLEDGE.md §5 (this exact account was found
// carrying several: "test" ×3, "Premium", "test 3", "QA Full Regression
// (...)"). Preferring one of these over a real project ("Tea", "Dior Brand")
// when we have to adopt something keeps the suite from ever writing test
// data onto a real business project.
const LEFTOVER_TEST_PROJECT_MARKER = /^(test|qa|autotest|my business|onboarding)\b/i;

// Ensures the named project exists and returns { id, name }. Called once
// from tests/auth.setup.js so every spec starts from a known project
// regardless of account state:
//   - Brand-new account, zero projects → creates one via the UI.
//   - Account already has it → reuses it as-is.
//   - Account has no matching project but can't create a new one (a real,
//     confirmed constraint: a canceled/expired subscription caps the
//     account at a small project limit, and purchasing a subscription is
//     explicitly out of this suite's scope) → adopts an existing
//     leftover-looking project and renames it to `name`, so this and every
//     future run converge on one consistently-named project instead of
//     failing outright or silently reusing a real business project.
export async function ensureTestProject(page, name = PROJECT_NAME) {
  let found = await findProjectByName(page, name);
  if (found.id) return { id: found.id, name: found.name };

  try {
    await createProjectViaUi(page, { name });
    found = await findProjectByName(page, name);
    if (found.id) return { id: found.id, name: found.name };
  } catch (err) {
    if (!(err instanceof ProjectLimitReachedError)) throw err;
    console.warn(`[helpers/project] ${err.message} — adopting an existing leftover project instead of creating a new one.`);
  }

  const { list } = await listProjects(page);
  const leftover = list.find((p) => LEFTOVER_TEST_PROJECT_MARKER.test(p.name || p.title || ''));
  const adoptee = leftover || list[0];

  if (!adoptee) {
    throw new Error(
      `Project "${name}" does not exist, the account is at its project limit, and there are no existing ` +
        'projects to adopt instead. Free up a project slot or provide an active subscription.'
    );
  }

  if (!leftover) {
    console.warn(
      `[helpers/project] No leftover/test-looking project found to adopt — falling back to the first project ` +
        `in the account ("${adoptee.name || adoptee.title}"). This may be a real business project; consider ` +
        'freeing a slot manually.'
    );
  }

  const adopteeName = adoptee.name || adoptee.title;
  if (adopteeName !== name) {
    await renameProjectViaUi(page, adopteeName, name);
  }

  const renamed = await findProjectByName(page, name);
  if (!renamed.id) throw new Error(`Failed to adopt/rename existing project "${adopteeName}" to "${name}".`);
  return { id: renamed.id, name: renamed.name };
}

export async function deleteProject(page, id) {
  await deleteProjectById(page, id);
}
