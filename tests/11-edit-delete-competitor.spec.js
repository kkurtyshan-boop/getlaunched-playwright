import { test } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, COMPETITOR_NAME } from './config';
import { createCompetitor, editCompetitorName, deleteCompetitor } from './helpers/competitor.helper';

// Self-contained: creates its own competitor instead of depending on
// 08-create-competitor-analysis.spec.js having run first and left a
// competitor named "Champ Tea" behind. This is the flow the request calls
// out by name (Dior Brand → Magic Triangle → Competitors → edit "Champ Tea
// (champtea.ch)" → "Champ Tea" → delete) — now driven entirely against the
// bootstrapped Autotest project with a generic, unique name.
test('Edit competitor name, then delete it', async ({ page, project }) => {
  await login(page);

  const originalName = await createCompetitor(page, project, { name: unique(COMPETITOR_NAME) }).then((c) => c.name);
  const updatedName = `${originalName} Edited`;

  await editCompetitorName(page, originalName, updatedName);
  await deleteCompetitor(page, updatedName);
});
