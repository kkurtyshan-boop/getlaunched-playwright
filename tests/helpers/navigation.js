import { expect } from '@playwright/test';

// Direct URL navigation into a bootstrapped project, per the URL scheme
// confirmed in .claude/skills/new-spec/PROJECT_KNOWLEDGE.md §2:
//   /project/{uuid}/{section}[/{subsection}]
// This replaces clicking through "find the project card by name → Magic
// triangle → Clients" in every spec: it's immune to duplicate/renamed
// project cards, doesn't depend on any specific project name, and is one
// line instead of ~15 repeated in every file.
async function gotoProjectPath(page, project, path) {
  await page.goto(`/project/${project.id}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page).not.toHaveURL(/\/sign-in/i, { timeout: 15000 });
}

export async function gotoProjectsList(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
}

export async function openProject(page, project) {
  await gotoProjectPath(page, project, '/dashboard');
}

export async function gotoTriangleOverview(page, project) {
  await gotoProjectPath(page, project, '/triangle');
}

export async function gotoClients(page, project) {
  await gotoProjectPath(page, project, '/triangle/clients');
  await expect(page.getByRole('button', { name: /^create client$/i })).toBeVisible({ timeout: 15000 });
}

export async function gotoProducts(page, project) {
  await gotoProjectPath(page, project, '/triangle/products');
  await expect(page.getByRole('button', { name: /^create product$/i }).first()).toBeVisible({ timeout: 15000 });
}

export async function gotoCompetitors(page, project) {
  await gotoProjectPath(page, project, '/triangle/competitors');
  await expect(page.locator('body')).toContainText(/competitors/i, { timeout: 15000 });
}

export async function gotoOperations(page, project) {
  await gotoProjectPath(page, project, '/operations');
}

export async function gotoImplementation(page, project) {
  await gotoProjectPath(page, project, '/implementation');
}

export async function gotoFinancial(page, project, sub = '') {
  await gotoProjectPath(page, project, `/financial${sub ? `/${sub}` : ''}`);
}

export async function gotoBusinessPlan(page, project) {
  await gotoProjectPath(page, project, '/business-plan/generate');
}
