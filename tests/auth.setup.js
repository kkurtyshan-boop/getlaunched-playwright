import { test as setup } from '@playwright/test';
import { login } from './helpers';
import { ensureTestProject } from './helpers/project';
import { writeRunContext } from './fixtures/project.fixture';

// Runs once before the chromium project (see playwright.config.ts), saves
// the authenticated session so specs don't each re-login through the UI,
// then bootstraps the shared test project (creating it via the UI if the
// account doesn't have one yet — see helpers/project.js) and writes its
// {id, name} to tests/.auth/run-context.json for the `project` fixture
// (fixtures/project.fixture.js) that every migrated spec consumes. This is
// what makes the suite work on a brand-new account with zero projects.
setup('authenticate', async ({ page }) => {
  await login(page);
  await page.context().storageState({ path: 'storageState.json' });

  const project = await ensureTestProject(page);
  writeRunContext(project);
});
