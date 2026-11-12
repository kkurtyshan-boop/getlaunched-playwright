import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const RUN_CONTEXT_PATH = path.join(process.cwd(), 'tests', '.auth', 'run-context.json');

export function writeRunContext(context) {
  fs.mkdirSync(path.dirname(RUN_CONTEXT_PATH), { recursive: true });
  fs.writeFileSync(RUN_CONTEXT_PATH, JSON.stringify(context, null, 2));
}

export function readRunContext() {
  const raw = fs.readFileSync(RUN_CONTEXT_PATH, 'utf-8');
  return JSON.parse(raw);
}

// Extends the base Playwright test with a `project` fixture — { id, name }
// of the test project bootstrapped once by the "setup" project
// (tests/auth.setup.js, via helpers/project.js's ensureTestProject). Every
// migrated spec imports `test`/`expect` from here instead of
// '@playwright/test' directly so it never has to search the project list by
// name itself.
export const test = base.extend({
  project: async ({}, use) => {
    let context;
    try {
      context = readRunContext();
    } catch {
      throw new Error(
        `Could not read ${RUN_CONTEXT_PATH}. The "setup" Playwright project ` +
          '(tests/auth.setup.js) must run before any spec that uses the `project` ' +
          'fixture — this happens automatically via the "chromium" project\'s ' +
          '`dependencies: [\'setup\']` in playwright.config.ts, including when you ' +
          'run a single spec file with --project=chromium.'
      );
    }
    await use(context);
  },
});

export { expect };
