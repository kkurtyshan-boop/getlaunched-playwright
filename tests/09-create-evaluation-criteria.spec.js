import { test } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique } from './config';
import { createEvaluationCriterion } from './helpers/evaluation.helper';
import { openSectionCreateModal, assertEmptyFormValidation } from './helpers/dom';
import { gotoCompetitors } from './helpers/navigation';

const CRITERIA_TO_CREATE = [
  { name: unique('Autotest Criterion Market Fit'), score: '2' },
  { name: unique('Autotest Criterion Product Value'), score: '5' },
  { name: unique('Autotest Criterion UX'), score: '7' },
  { name: unique('Autotest Criterion Pricing'), score: '10' },
];

test.describe.serial('Evaluation criteria flow', () => {
  test('01. Evaluation criteria - validation on create', async ({ page, project }) => {
    await login(page);
    await gotoCompetitors(page, project);

    const modal = await openSectionCreateModal(page, 'Evaluation criteria');
    await assertEmptyFormValidation(modal);
  });

  test('02. Create evaluation criteria', async ({ page, project }) => {
    test.setTimeout(90_000);
    await login(page);

    for (const criterion of CRITERIA_TO_CREATE) {
      await createEvaluationCriterion(page, project, criterion);
    }
  });
});
