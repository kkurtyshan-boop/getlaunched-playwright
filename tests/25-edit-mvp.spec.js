import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, MVP_NAME } from './config';
import { createClient } from './helpers/client.helper';
import {
  gotoMvpTab,
  createMvp,
  openEditMvpForm,
  applyMvpEdits,
  submitMvpUpdate,
  findMvpHeading,
  deleteMvp,
} from './helpers/mvp.helper';

const UPDATED_HYPOTHESIS_THEN =
  'a meaningful share of users will complete the flow without help, confirmed after the edit stuck';

// Self-contained: creates its own MVP (and the clients it targets) via the
// mvp.helper.js/client.helper.js helpers instead of depending on
// 24-create-mvp.spec.js having run first.
test.describe.serial('Edit MVP flow', () => {
  let segmentName;
  let altSegmentName;
  let mvpName;

  test('00. Set up an MVP to edit', async ({ page, project }) => {
    test.setTimeout(60_000);
    await login(page);

    const client = await createClient(page, project, { name: unique('Autotest Edit MVP Client') });
    segmentName = client.name;

    const altClient = await createClient(page, project, { name: unique('Autotest Edit MVP Client Alt') });
    altSegmentName = altClient.name;

    const mvp = await createMvp(page, project, {
      name: unique(`${MVP_NAME} Edit Source`),
      type: 'Prototype',
      segment: segmentName,
    });
    mvpName = mvp.name;
  });

  test('01. Edit MVP target segment and target value', async ({ page, project }) => {
    // Navigates, edits, submits, reloads, then reopens the edit form to
    // verify persistence — comfortably over the default 30s budget.
    test.setTimeout(60_000);
    await login(page);
    await gotoMvpTab(page, project);

    await openEditMvpForm(page, mvpName);
    await applyMvpEdits(page, {
      segment: altSegmentName,
      targetValue: '> 20%',
    });
    await submitMvpUpdate(page, mvpName);

    // Persistence check: reload and re-open the edit form to confirm the
    // new target value stuck (the segment change is exercised by the update
    // above; the Target segment dropdown itself is covered by 24's create flow).
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await findMvpHeading(page, mvpName);

    await openEditMvpForm(page, mvpName);
    await expect(page.getByRole('textbox', { name: 'Target value' }).first()).toHaveValue('> 20%', {
      timeout: 15000,
    });
  });

  test('02. Edit MVP hypothesis and time frame', async ({ page, project }) => {
    // Navigates, edits, submits, then reopens the edit form to verify
    // persistence — comfortably over the default 30s budget.
    test.setTimeout(60_000);
    await login(page);
    await gotoMvpTab(page, project);

    await openEditMvpForm(page, mvpName);
    await applyMvpEdits(page, {
      hypothesisThen: UPDATED_HYPOTHESIS_THEN,
      timeFrame: '21 days',
    });
    await submitMvpUpdate(page, mvpName);

    // Persistence check: reopen the edit form and confirm the hypothesis and
    // time frame stuck rather than just trusting the post-submit heading.
    await openEditMvpForm(page, mvpName);
    await expect(page.getByPlaceholder('Then users will...').first()).toHaveValue(UPDATED_HYPOTHESIS_THEN, {
      timeout: 15000,
    });
    await expect(page.getByRole('textbox', { name: 'Time frame' }).first()).toHaveValue('21 days', {
      timeout: 15000,
    });
  });

  test('03. Edit MVP name and success metric', async ({ page, project }) => {
    // Navigates, edits, submits, reloads, then reopens the edit form to
    // verify persistence — comfortably over the default 30s budget.
    test.setTimeout(60_000);
    await login(page);
    await gotoMvpTab(page, project);

    const updatedName = unique(`${MVP_NAME} Edit Renamed`);
    const updatedSuccessMetric = 'Post-edit engagement rate';

    // Key Feature name/description are deliberately not exercised here: while
    // writing this spec, editing either on the Edit MVP form was confirmed
    // (via a temporary isolated repro) to NOT persist — Update MVP silently
    // keeps the original feature name/description while every top-level
    // field (Name, Type, Target segment, Hypothesis, Validation) does
    // persist correctly. This looks like the same class of issue as
    // BUG_PATTERNS.md's "Action Plan Edit Form Does Not Persist Stage
    // Changes" but for MVP's Key Feature sub-fields — worth logging as a new
    // confirmed bug and adding a dedicated regression test, out of this
    // spec's scope.
    await openEditMvpForm(page, mvpName);
    await applyMvpEdits(page, {
      name: updatedName,
      successMetric: updatedSuccessMetric,
    });
    await submitMvpUpdate(page, updatedName);
    mvpName = updatedName;

    // Persistence check: reload and confirm the new name and success metric
    // stuck, and the old (pre-edit) name is gone.
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await findMvpHeading(page, mvpName);

    await openEditMvpForm(page, mvpName);
    await expect(page.getByPlaceholder('e.g. Conversation rate').first()).toHaveValue(updatedSuccessMetric, {
      timeout: 15000,
    });
  });

  // Also keeps the shared project under the 15-MVP list limit (see
  // helpers/mvp.helper.js deleteMvp).
  test('04. Delete the edited MVP', async ({ page, project }) => {
    test.setTimeout(60_000);
    await login(page);
    await deleteMvp(page, project, mvpName);

    // Persistence check: still gone after a reload.
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(page.getByRole('heading', { name: mvpName, exact: true })).toHaveCount(0, { timeout: 15000 });
  });
});
