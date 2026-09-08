import { test } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, COMPETITOR_NAME } from './config';
import { createCompetitor } from './helpers/competitor.helper';
import { openSectionCreateModal, assertEmptyFormValidation } from './helpers/dom';
import { gotoCompetitors } from './helpers/navigation';

// Generic fixture data covering all three Competitor Types (Direct /
// Indirect / Potential) — see PROJECT_KNOWLEDGE.md §3.2. Other specs that
// need competitors (10, 11) create their own via createCompetitor() rather
// than depending on this file having run first.
const COMPETITORS_TO_CREATE = [
  { name: unique(COMPETITOR_NAME), type: 'Direct' },
  { name: unique(`${COMPETITOR_NAME} Indirect`), type: 'Indirect' },
  { name: unique(`${COMPETITOR_NAME} Potential`), type: 'Potential' },
];

test.describe.serial('Competitors flow', () => {
  test('01. Competitors - validation on create', async ({ page, project }) => {
    await login(page);
    await gotoCompetitors(page, project);

    const modal = await openSectionCreateModal(page, 'Competitors');
    await assertEmptyFormValidation(modal);
  });

  test('02. Create competitors', async ({ page, project }) => {
    test.setTimeout(90_000);
    await login(page);

    for (const competitor of COMPETITORS_TO_CREATE) {
      await createCompetitor(page, project, competitor);
    }
  });
});
