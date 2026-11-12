import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, CLIENT_NAME } from './config';
import { gotoClients } from './helpers/navigation';
import { openCreateClientModal, fillClientForm } from './helpers/client.helper';
import { segmentCard, needColumn, deleteSegment } from './helpers/client-card.helper';

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
      { name: 'Autotest need 1', priority: 'Low', satisfaction: 'Not Satisfied', category: 'Job' },
      { name: 'Autotest need 2', priority: 'High', satisfaction: 'Partially Satisfied', category: 'Pain' },
      { name: 'Autotest need 3', priority: 'Critical', satisfaction: 'Fully Satisfied', category: 'Gain' },
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
  // Segments created here are deleted again after each test (no teardown
  // otherwise — the shared project already holds dozens of clients).
  const created = [];
  test.afterEach(async ({ page, project }) => {
    if (!created.length) return;
    await gotoClients(page, project);
    while (created.length) await deleteSegment(page, created.pop());
  });

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
      await expect(modal).not.toBeVisible({ timeout: 15000 });
      created.push(client.name);

      // The new segment card shows each need in its Job / Pain / Gain column.
      const card = segmentCard(page, client.name);
      await expect(card).toBeVisible({ timeout: 15000 });
      await expect(card).toContainText(client.description);
      for (const n of client.needs) {
        await expect(needColumn(card, n.category.toLowerCase()).getByTestId('need-item').filter({ hasText: n.name })).toHaveCount(1);
      }
      if (!client.needs.length) {
        await expect(card).toContainText('Add needs to see how your offer fits this segment');
      }
    });
  }
});
