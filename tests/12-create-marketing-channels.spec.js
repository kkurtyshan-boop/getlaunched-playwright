import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, CHANNEL_NAME } from './config';
import { createClient } from './helpers/client.helper';
import {
  gotoMarketingChannels,
  openCreateChannelModal,
  fillChannelStep,
  createMarketingChannel,
  getChannelRow,
} from './helpers/marketing.helper';

// Category option labels are Title Case in the live app today (e.g. "Social
// Media", "Paid Search" — no longer "Social media"/"Paid search (Google
// Ads)"); see BUG_PATTERNS.md "Marketing Channel Category Labels
// Recapitalized...". "Other" is deliberately NOT exercised as a full create
// here (test 02 only asserts its free-text field appears) because any custom
// "Other" category name typed into that field permanently joins the shared
// per-project Category dropdown for every future channel, with no found way
// to remove it — see BUG_PATTERNS.md "Marketing Channel — Custom 'Other'
// Category Names Permanently Pollute the Shared Category Dropdown".
// Creating a fresh custom value on every run would keep compounding that
// pollution.
const BUILT_IN_CATEGORIES = [
  'Social Media',
  'Paid Search',
  'SEO & Content',
  'Email Marketing',
  'Events & PR',
  'Direct Sales',
  'Referral',
];

test.describe.serial('Marketing channels flow', () => {
  test('01. Validation for empty channel form', async ({ page, project }) => {
    await login(page);
    await gotoMarketingChannels(page, project);

    const modal = await openCreateChannelModal(page);

    const nextButton = modal.getByRole('button', { name: /^next$/i }).first();
    await expect(nextButton).toBeVisible({ timeout: 15000 });
    await nextButton.click();

    await expect(
      modal.getByText(/required|must be at least|can't be blank/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('02. "Other" category reveals a custom category name field', async ({ page, project }) => {
    await login(page);
    await gotoMarketingChannels(page, project);

    const modal = await openCreateChannelModal(page);

    // Deliberately doesn't submit a new custom category name — see file
    // header comment — this only exercises that selecting "Other" reveals
    // the free-text field.
    await fillChannelStep(page, modal, { category: 'Other' });

    const customCategoryField = modal.getByPlaceholder(/type category name/i).first();
    await expect(customCategoryField).toBeVisible({ timeout: 15000 });
  });

  test('03. Create marketing channels for all built-in categories', async ({ page, project }) => {
    // 7 channels, 2-step wizard each, plus a shared client to attach — well
    // beyond the default 30s timeout.
    test.setTimeout(240_000);

    await login(page);

    const client = await createClient(page, project, { name: unique('Autotest Channel Client') });

    for (const category of BUILT_IN_CATEGORIES) {
      const channel = await createMarketingChannel(page, project, {
        name: unique(CHANNEL_NAME),
        category,
        client: client.name,
        strategy: `Strategy for the ${category} channel, created by the automated test suite.`,
      });

      await expect(await getChannelRow(page, channel.name)).toBeVisible({ timeout: 15000 });
    }
  });
});
