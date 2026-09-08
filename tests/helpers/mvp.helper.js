import { expect } from '@playwright/test';
import { gotoImplementation } from './navigation';
import { createClient } from './client.helper';
import { MVP_NAME, unique } from '../config';

// Implementation is tabbed: Risk analysis (default) / Action plan / MVP.
// `gotoImplementation` lands on the default tab; click "MVP" from there.
export async function gotoMvpTab(page, project) {
  await gotoImplementation(page, project);

  const mvpTab = page.getByRole('tab', { name: /^mvp$/i }).first();
  await expect(mvpTab).toBeVisible({ timeout: 15000 });
  await mvpTab.click();

  await expect(page.getByRole('button', { name: /^create mvp$/i }).first()).toBeVisible({ timeout: 15000 });
}

// The app-wide custom dropdown pattern (CLAUDE.md "Selectors & waits"):
// button[data-open="false"] -> listbox -> option. Scoped by index because
// the MVP form renders several of these on one page (Type, Target segment,
// Feature type).
export async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel, exact = true) {
  const dropdownButton = scope.locator('button[data-open="false"]').nth(dropdownIndex);

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: optionLabel, exact }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();

  // Wait for the listbox to actually close before returning — otherwise a
  // dropdown opened moments later can race against this one's still-closing
  // listbox and resolve `getByRole('listbox').last()` to the wrong element.
  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});
}

// Create MVP is a dedicated full page, not a modal (the one exception to the
// app's modal-everywhere convention) — "Create MVP" stays visible on the MVP
// list page after each creation, so it can be re-clicked for the next one.
export async function openCreateMvpForm(page) {
  const createMvpButton = page.getByRole('button', { name: /^create mvp$/i }).first();
  await expect(createMvpButton).toBeVisible({ timeout: 15000 });
  await createMvpButton.click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  await expect(page.getByPlaceholder('Type MVP Name...').first()).toBeVisible({ timeout: 15000 });
}

// Fields in order: MVP Name, Type, Target segment, Hypothesis (If/Then/
// Because), Key feature (name + Feature type + description), Validation
// (Success metric, Target value, Time frame). Dropdown positions on this
// page: Type(0), Target segment(1), Feature type(2).
export async function fillMvpForm(page, mvp) {
  const nameField = page.getByPlaceholder('Type MVP Name...').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(mvp.name);

  await selectFromCustomDropdown(page, page, 0, mvp.type);
  await selectFromCustomDropdown(page, page, 1, mvp.segment, false);

  await page.getByPlaceholder('If we build/test...').first().fill(mvp.hypothesisIf);
  await page.getByPlaceholder('Then users will...').first().fill(mvp.hypothesisThen);
  await page.getByPlaceholder('Because we believe...').first().fill(mvp.hypothesisBecause);

  await page.getByPlaceholder('Type feature name...').first().fill(mvp.feature.name);
  await selectFromCustomDropdown(page, page, 2, mvp.feature.type);
  await page.getByPlaceholder('Write your story...').first().fill(mvp.feature.description);

  // Target value / Time frame share the same "Select" placeholder — match by
  // accessible name instead, they are plain text fields despite the icon.
  await page.getByPlaceholder('e.g. Conversation rate').first().fill(mvp.validation.successMetric);
  await page.getByRole('textbox', { name: 'Target value' }).first().fill(mvp.validation.targetValue);
  await page.getByRole('textbox', { name: 'Time frame' }).first().fill(mvp.validation.timeFrame);
}

// The shared "Autotest Project" accumulates MVPs across every run (no
// teardown — see CLAUDE.md "Data hygiene"), and the MVP list lazily renders
// more cards on scroll once there are enough of them (the same lazy-render
// behavior already documented for the Products list in BUG_PATTERNS.md
// "Duplicate Products..."). So a just-created/just-renamed MVP's heading
// isn't always in the initially-rendered DOM — poll with a scroll nudge
// between attempts instead of a single visibility check.
export async function findMvpHeading(page, mvpName) {
  const heading = page.getByRole('heading', { name: mvpName, exact: true }).first();

  let attempt = 0;
  await expect(async () => {
    if (await heading.isVisible().catch(() => false)) return;
    attempt += 1;
    // Mix scroll nudges with an occasional full reload — a scroll nudge
    // alone doesn't help if the list is stale/client-cached rather than
    // lazily rendered.
    if (attempt % 3 === 0) {
      await page.reload();
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    } else {
      await page.mouse.wheel(0, 2000);
    }
    expect(await heading.isVisible().catch(() => false)).toBe(true);
  }).toPass({ timeout: 45000, intervals: [500] });

  return heading;
}

export async function submitMvpCreate(page, expectedName, project) {
  const submitButton = page.getByRole('button', { name: /^create mvp$/i }).last();
  await expect(submitButton).toBeVisible({ timeout: 15000 });
  await submitButton.click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  // Confirmed live: a successful submit does NOT always navigate back to
  // the MVP list — it can instead reset the same Create MVP form in place
  // (URL stays on /create, every field goes blank again) so the page is
  // ready for the next entry. `findMvpHeading` only makes sense on the
  // list, so detect the reset-in-place case and navigate there explicitly
  // before searching for the new card.
  const stillOnCreateForm = await page.getByPlaceholder('Type MVP Name...').first().isVisible().catch(() => false);
  if (stillOnCreateForm && project) {
    await gotoMvpTab(page, project);
  }

  await findMvpHeading(page, expectedName);
}

// Negative path: an MVP whose Key Features are all "Optional" is rejected
// (see BUG_PATTERNS.md "MVP Submission Requires At Least One 'Core'
// Feature"). A successful submit navigates back to the MVP list
// (`submitMvpCreate`'s heading check); rejection means the full-page create
// form is still showing, so assert the name field is still there instead of
// guessing at an exact error/toast string.
export async function submitMvpCreateExpectRejection(page) {
  const submitButton = page.getByRole('button', { name: /^create mvp$/i }).last();
  await expect(submitButton).toBeVisible({ timeout: 15000 });
  await submitButton.click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  await expect(page.getByPlaceholder('Type MVP Name...').first()).toBeVisible({ timeout: 5000 });
}

// Creates an MVP via the real UI full-page form and returns the fixture
// used. Always includes at least one Core Key Feature unless `overrides`
// explicitly requests otherwise (e.g. a deliberate all-Optional rejection
// test, which should compose the lower-level helpers above directly instead
// of this one since this helper asserts success).
//
// `overrides.segment` may be an existing client/segment name; if omitted, a
// fresh client is created via `createClient` so this stays self-contained
// (Target segment is sourced from Clients — a cross-module dependency).
export async function createMvp(page, project, overrides = {}) {
  let segment = overrides.segment;
  if (!segment) {
    const client = await createClient(page, project, { name: unique('Autotest MVP Client') });
    segment = client.name;
  }

  const mvp = {
    name: overrides.name || unique(MVP_NAME),
    type: overrides.type || 'Prototype',
    segment,
    hypothesisIf: overrides.hypothesisIf || 'we build a lightweight version of the proposed feature',
    hypothesisThen: overrides.hypothesisThen || 'target users will complete the core task without assistance',
    hypothesisBecause: overrides.hypothesisBecause || 'early feedback suggests real demand for this capability',
    feature: overrides.feature || {
      name: 'Core capability',
      type: 'Core',
      description: 'The primary capability this MVP validates.',
    },
    validation: overrides.validation || {
      successMetric: 'Engagement rate',
      targetValue: '> 15%',
      timeFrame: '30 days',
    },
  };

  await gotoMvpTab(page, project);
  await openCreateMvpForm(page);
  await fillMvpForm(page, mvp);
  await submitMvpCreate(page, mvp.name, project);

  return mvp;
}

export async function openEditMvpForm(page, mvpName) {
  const heading = await findMvpHeading(page, mvpName);

  const cardContainer = heading.locator('xpath=ancestor::*[1]');
  const menuButton = cardContainer.getByRole('button', { name: /open actions menu/i }).first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click();

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page.getByPlaceholder('Type MVP Name...').first()).toBeVisible({ timeout: 15000 });
}

// Only touches the fields present in `changes`, leaving the rest of the
// pre-filled edit form untouched. Dropdown positions: Type(0), Target
// segment(1), Feature type(2).
export async function applyMvpEdits(page, changes) {
  if (changes.name) {
    const field = page.getByPlaceholder('Type MVP Name...').first();
    await field.fill(changes.name);
  }

  if (changes.type) {
    await selectFromCustomDropdown(page, page, 0, changes.type);
  }

  if (changes.segment) {
    await selectFromCustomDropdown(page, page, 1, changes.segment, false);
  }

  if (changes.hypothesisIf) {
    await page.getByPlaceholder('If we build/test...').first().fill(changes.hypothesisIf);
  }

  if (changes.hypothesisThen) {
    await page.getByPlaceholder('Then users will...').first().fill(changes.hypothesisThen);
  }

  if (changes.hypothesisBecause) {
    await page.getByPlaceholder('Because we believe...').first().fill(changes.hypothesisBecause);
  }

  if (changes.featureName) {
    await page.getByPlaceholder('Type feature name...').first().fill(changes.featureName);
  }

  if (changes.featureType) {
    await selectFromCustomDropdown(page, page, 2, changes.featureType);
  }

  if (changes.featureDescription) {
    await page.getByPlaceholder('Write your story...').first().fill(changes.featureDescription);
  }

  if (changes.successMetric) {
    await page.getByPlaceholder('e.g. Conversation rate').first().fill(changes.successMetric);
  }

  if (changes.targetValue) {
    await page.getByRole('textbox', { name: 'Target value' }).first().fill(changes.targetValue);
  }

  if (changes.timeFrame) {
    await page.getByRole('textbox', { name: 'Time frame' }).first().fill(changes.timeFrame);
  }
}

export async function submitMvpUpdate(page, expectedName) {
  const updateButton = page.getByRole('button', { name: /^update mvp$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  await findMvpHeading(page, expectedName);
}
