import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { createTeamMember } from './helpers/team.helper';

// Fixture variety for the current form shapes (2026-11): Key members carry
// Salary per year + Employment % per year (whole numbers); Line staff carry
// FTE per year (decimals allowed) + Salary per year. Names come from the
// helper's TEAM_MEMBER_NAME + unique() defaults, so every run is
// collision-free on the shared project.
const KEY_MEMBER_VARIANTS = [
  { salary: '102000', employmentPercents: ['100'] },
  { salary: '93600', employmentPercents: ['80', '100'] },
  { salary: '48000', employmentPercents: ['50'] },
];

const LINE_STAFF_VARIANTS = [
  { salary: '264000', fte: ['1', '2'] },
  { salary: '60000', fte: ['0.5', '1.5'] },
  { salary: '216000', fte: ['3', '3'] },
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

    await login(page);

    for (const variant of LINE_STAFF_VARIANTS) {
      const staff = await createTeamMember(page, project, { type: 'line', ...variant });
      await expect(page.getByText(staff.cardText, { exact: false }).first()).toBeVisible({ timeout: 15000 });
    }
  });
});
