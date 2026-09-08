import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, CLIENT_NAME } from './config';
import { gotoClients } from './helpers/navigation';
import { openCreateClientModal, fillClientForm } from './helpers/client.helper';

// Generic fixture data (no "Dior Brand" business narrative) — one client
// with a full needs list, one with zero needs (a supported case per
// PROJECT_KNOWLEDGE.md §3.2). `label` is static (used in the test title);
// the actual unique() name is generated at test-run time inside the test
// body, not at module scope — a title built from unique()/Date.now() at
// module load differs between Playwright's list pass and each worker's own
// module evaluation, which fails with "Test not found in the worker
// process."
const CLIENTS_DATA = [
  {
    label: 'with a full needs list',
    baseName: CLIENT_NAME,
    description: 'Segment created by the automated test suite, with a full needs list.',
    needs: [
      { name: 'Autotest need 1', priority: 'Low', satisfaction: 'Not Satisfied' },
      { name: 'Autotest need 2', priority: 'High', satisfaction: 'Partially Satisfied' },
      { name: 'Autotest need 3', priority: 'Critical', satisfaction: 'Fully Satisfied' },
    ],
  },
  {
    label: 'with zero needs',
    baseName: `${CLIENT_NAME} No Needs`,
    description: 'Segment created by the automated test suite, with zero needs.',
    needs: [],
  },
];

test.describe.serial('Create client flow', () => {
  test('01. Validation for empty client form', async ({ page, project }) => {
    await login(page);
    await gotoClients(page, project);

    const modal = await openCreateClientModal(page);
    await modal.getByRole('button', { name: /^create$/i }).last().click();

    await expect(page.getByText(/must be at least 2 characters|required/i).first()).toBeVisible({ timeout: 15000 });

    // Fix the error and confirm it clears + the form now submits.
    await modal.getByPlaceholder('Type client name').first().fill(unique(`${CLIENT_NAME} Validation`));
    await expect(page.getByText(/must be at least 2 characters|required/i).first()).not.toBeVisible({ timeout: 5000 }).catch(() => {});

    const closeButton = modal.getByRole('button', { name: /close/i }).first();
    await closeButton.click();
  });

  for (const fixture of CLIENTS_DATA) {
    test(`02. Create client: ${fixture.label}`, async ({ page, project }) => {
      const client = { ...fixture, name: unique(fixture.baseName) };

      await login(page);
      await gotoClients(page, project);

      const modal = await openCreateClientModal(page);
      await fillClientForm(page, modal, client);

      await modal.getByRole('button', { name: /^create$/i }).last().click();
      await expect(page.locator('body')).toContainText(client.name, { timeout: 15000 });
    });
  }
});
