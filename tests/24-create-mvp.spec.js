import { test, expect, readRunContext } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, MVP_NAME } from './config';
import { createClient } from './helpers/client.helper';
import {
  gotoMvpTab,
  openCreateMvpForm,
  fillMvpForm,
  submitMvpCreateExpectRejection,
  createMvp,
  cleanupMvps,
} from './helpers/mvp.helper';

// Generic (non-branded) fixture data covering distinct MVP Types. Each entry
// always carries a Core Key Feature — see BUG_PATTERNS.md "MVP Submission
// Requires At Least One 'Core' Feature". Names are generated at runtime
// inside each test body via unique(), not at module load (a title built
// from unique()/Date.now() at module scope fails with "Test not found in
// the worker process" — see CLAUDE.md / hard-won lessons).
const MVP_TYPE_SCENARIOS = [
  {
    type: 'Prototype',
    hypothesisIf: 'we build a working prototype of the proposed feature',
    hypothesisThen: 'target users will complete the core task without assistance',
    hypothesisBecause: 'early user interviews suggest this workflow is currently too slow',
    feature: {
      name: 'Core workflow',
      type: 'Core',
      description: 'The primary workflow this prototype validates end to end.',
    },
    validation: { successMetric: 'Task completion rate', targetValue: '> 70%', timeFrame: '14 days' },
  },
  {
    type: 'Test sales',
    hypothesisIf: 'we open a limited pre-order window for the new offering',
    hypothesisThen: 'a meaningful share of visitors will commit to a purchase before launch',
    hypothesisBecause: 'demand signals suggest this could be commercially viable',
    feature: {
      name: 'Pre-order flow',
      type: 'Core',
      description: 'Dedicated flow to collect pre-orders with a deposit payment.',
    },
    validation: { successMetric: 'Pre-order conversion rate', targetValue: '> 10%', timeFrame: '14 days' },
  },
  {
    type: 'Pilot project',
    hypothesisIf: 'we run a small-scale pilot of the new service with a limited group',
    hypothesisThen: 'participants will report higher satisfaction than the current process',
    hypothesisBecause: 'qualitative feedback suggests the current process under-serves this segment',
    feature: {
      name: 'Pilot onboarding',
      type: 'Core',
      description: 'Guided onboarding flow used only during the pilot.',
    },
    validation: { successMetric: 'Participant satisfaction score', targetValue: '> 8/10', timeFrame: '30 days' },
  },
  {
    type: 'Landing page',
    hypothesisIf: 'we publish a landing page describing the new offering',
    hypothesisThen: 'visitors will sign up to be notified when it becomes available',
    hypothesisBecause: 'there is currently no low-cost way to gauge interest ahead of a full build',
    feature: {
      name: 'Signup form',
      type: 'Core',
      description: 'Capture interested visitors ahead of the full launch.',
    },
    validation: { successMetric: 'Signup conversion rate', targetValue: '> 8%', timeFrame: '21 days' },
  },
  {
    type: 'Explanatory video',
    hypothesisIf: 'we publish a short video explaining how the new offering works',
    hypothesisThen: 'viewers will spend more time exploring the related content afterward',
    hypothesisBecause: 'users currently report confusion about how this capability works',
    feature: {
      name: 'Embedded video widget',
      type: 'Core',
      description: 'Short explainer video embedded on the relevant page.',
    },
    validation: { successMetric: 'Post-video engagement', targetValue: '> 25%', timeFrame: '30 days' },
  },
];

test.describe.serial('MVP flow', () => {
  let segmentName;
  // Every MVP this run creates — deleted again in afterAll so the shared
  // project never grows past the 15 MVPs the list can show.
  const createdMvpNames = [];

  test.afterAll(async ({ browser }) => {
    // ~20s per delete (navigate + confirm + verify) — the default 30s hook
    // budget only fits one or two.
    test.setTimeout(240_000);
    await cleanupMvps(browser, test.info().project.use.baseURL, readRunContext(), createdMvpNames, login);
  });

  test('00. Set up a target segment client for the MVPs', async ({ page, project }) => {
    await login(page);

    const client = await createClient(page, project, { name: unique('Autotest MVP Client') });
    segmentName = client.name;
  });

  test('01. Create an MVP for each type', async ({ page, project }) => {
    // 5 MVPs, each a long multi-section full-page form — well beyond the default 30s timeout
    test.setTimeout(300_000);

    await login(page);

    for (const scenario of MVP_TYPE_SCENARIOS) {
      const name = unique(`${MVP_NAME} ${scenario.type}`);
      createdMvpNames.push(name);
      await createMvp(page, project, {
        name,
        type: scenario.type,
        segment: segmentName,
        hypothesisIf: scenario.hypothesisIf,
        hypothesisThen: scenario.hypothesisThen,
        hypothesisBecause: scenario.hypothesisBecause,
        feature: scenario.feature,
        validation: scenario.validation,
      });
    }
  });

  // Real, currently-untested business rule (RELEASE_CHECKLIST.md §16 /
  // BUG_PATTERNS.md "MVP Submission Requires At Least One 'Core' Feature"):
  // an MVP whose only Key Feature is "Optional" must be rejected on submit.
  test('02. Reject an MVP whose only Key Feature is Optional', async ({ page, project }) => {
    await login(page);
    await gotoMvpTab(page, project);
    await openCreateMvpForm(page);

    const mvp = {
      name: unique(`${MVP_NAME} All-Optional`),
      type: 'Prototype',
      segment: segmentName,
      hypothesisIf: 'we add a nice-to-have enhancement to the existing flow',
      hypothesisThen: 'a few users notice the enhancement',
      hypothesisBecause: 'it is low effort to build',
      feature: {
        name: 'Nice-to-have widget',
        type: 'Optional',
        description: 'A non-essential enhancement with no Core feature backing it.',
      },
      validation: { successMetric: 'Usage rate', targetValue: '> 1%', timeFrame: '30 days' },
    };

    await fillMvpForm(page, mvp);
    await submitMvpCreateExpectRejection(page);

    // Confirm the rejected MVP never actually landed in the list.
    await expect(page.getByRole('heading', { name: mvp.name, exact: true })).toHaveCount(0);
  });
});
