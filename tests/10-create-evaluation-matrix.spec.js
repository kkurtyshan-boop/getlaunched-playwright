import { test } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique } from './config';
import { createCompetitor } from './helpers/competitor.helper';
import {
  createEvaluationCriterion,
  getMatrixColumnIndex,
  setMatrixScore,
  verifyWeightedScore,
} from './helpers/evaluation.helper';

// Self-contained: creates its own competitors + criteria instead of
// depending on 08/09 having run first. Verification recomputes the
// weighted-score formula (Σ(weight × score) / Σ(weights) — confirmed,
// PROJECT_KNOWLEDGE.md §3.2) from every row actually on screen, not just
// this fixture's own rows/columns — the matrix's competitor columns are not
// guaranteed to start at index 0 on a shared/adopted project that already
// carries other competitors and criteria (see helpers/project.js).
const COMPETITORS = [
  { name: unique('Autotest Matrix Competitor A'), type: 'Direct' },
  { name: unique('Autotest Matrix Competitor B'), type: 'Indirect' },
  { name: unique('Autotest Matrix Competitor C'), type: 'Potential' },
];

const CRITERIA = [
  { name: unique('Autotest Matrix Criterion 1'), weight: 3, scores: [1, 3, 9] },
  { name: unique('Autotest Matrix Criterion 2'), weight: 6, scores: [4, 7, 9] },
  { name: unique('Autotest Matrix Criterion 3'), weight: 10, scores: [10, 6, 8] },
];

test('Set and verify evaluation matrix scores', async ({ page, project }) => {
  test.setTimeout(150_000);
  await login(page);

  for (const competitor of COMPETITORS) {
    await createCompetitor(page, project, competitor);
  }
  for (const criterion of CRITERIA) {
    await createEvaluationCriterion(page, project, { name: criterion.name, score: String(criterion.weight) });
  }

  const columnIndexes = [];
  for (const competitor of COMPETITORS) {
    columnIndexes.push(await getMatrixColumnIndex(page, competitor.name));
  }

  for (const criterion of CRITERIA) {
    for (let col = 0; col < COMPETITORS.length; col++) {
      await setMatrixScore(page, criterion.name, columnIndexes[col], criterion.scores[col]);
    }
  }

  for (const competitor of COMPETITORS) {
    await verifyWeightedScore(page, competitor.name);
  }
});
