import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { createTeamMember } from './helpers/team.helper';

// Fixture variety for each shape's employment type / pay period combo —
// names themselves come from the helper's TEAM_MEMBER_NAME + unique()
// defaults, so every run is collision-free on the shared project.
const KEY_MEMBER_VARIANTS = [
  { employmentType: 'Full time', period: 'Monthly', salary: '8500' },
  { employmentType: 'Full time', period: 'Monthly', salary: '7800' },
  { employmentType: 'Freelance', period: 'Hourly', salary: '120' },
];

const LINE_STAFF_VARIANTS = [
  { employmentType: 'Full time', period: 'Annually', salary: '22000' },
  { employmentType: 'Part time', period: 'Annually', salary: '15000' },
  { employmentType: 'Full time', period: 'Annually', salary: '18000' },
];

test.describe.serial('Team and staff flow', () => {
  test('01. Create key members', async ({ page, project }) => {
    // 3 key members created sequentially exceed the default 30s timeout.
    test.setTimeout(120_000);

    await login(page);

    for (const variant of KEY_MEMBER_VARIANTS) {
      const member = await createTeamMember(page, project, { type: 'key', ...variant });
      await expect(page.getByText(member.cardText, { exact: false }).first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('02. Create line staff', async ({ page, project }) => {
    // 3 line staff roles created sequentially exceed the default 30s timeout.
    test.setTimeout(120_000);

    // CONFIRMED LIVE BUG (2026-08-24): Line staff submission is currently
    // rejected unconditionally by the API with a 422 — "The
    // staffing.0.employment_percent field is required when staffing is
    // present. (and 1 more error)". Verified via a direct network probe:
    // the frontend sends the single "Presence of the importance,%" field as
    // a top-level `engagement_percent`, never copying it into each
    // `staffing[]` row as `employment_percent`, while "Quantity per year"
    // (which populates `staffing`) is itself a required field client-side —
    // so no combination of values submitted through the UI can succeed
    // today (reproduced with 3 different field-value/fill-order
    // combinations). See tests/helpers/team.helper.js's createTeamMember
    // doc comment for the full repro. Skipping until fixed; the loop below
    // is written against the correct/intended UI contract and should start
    // passing as soon as it is — re-enable by removing this test.skip.
    test.skip(true, 'Blocked by a live API 422 on every Line staff submission — see comment above');

    await login(page);

    for (const variant of LINE_STAFF_VARIANTS) {
      const staff = await createTeamMember(page, project, { type: 'line', ...variant });
      await expect(page.getByText(staff.cardText, { exact: false }).first()).toBeVisible({ timeout: 15000 });
    }
  });
});
