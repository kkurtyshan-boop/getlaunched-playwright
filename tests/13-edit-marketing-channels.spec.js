import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique, CHANNEL_NAME } from './config';
import { createClient } from './helpers/client.helper';
import { createProduct } from './helpers/product.helper';
import {
  createMarketingChannel,
  editMarketingChannel,
  getChannelRow,
} from './helpers/marketing.helper';

// Self-contained: creates its own channels instead of depending on
// 12-create-marketing-channels.spec.js having run first and left specific
// named channels behind. Follows the tests/07-edit-product-add-delete-client
// pattern — a "00. Set up" test creates the records, later tests each edit
// one aspect and re-assign their own `let` var if the channel gets renamed.
test.describe.serial('Edit marketing channels flow', () => {
  let channelAName;
  let channelBName;
  let channelCName;
  let switchProductName;
  let switchClientName;

  test('00. Set up channels to edit', async ({ page, project }) => {
    test.setTimeout(120_000);
    await login(page);

    const channelA = await createMarketingChannel(page, project, { name: unique(CHANNEL_NAME) });
    channelAName = channelA.name;

    const channelB = await createMarketingChannel(page, project, { name: unique(CHANNEL_NAME) });
    channelBName = channelB.name;

    // A second, pre-existing Product+Client pair to switch channel B onto
    // in test 02. Live-checked (see marketing.helper.js): the channel
    // wizard's "Client connection" dropdown only lists clients already
    // attached to the currently selected Product ("Business unit"), so
    // switching the client also requires switching to a Product that
    // already has that client attached — built here via createProduct's
    // own client-attach step (live-checked: attaching a second client to
    // an already-populated product via a separate Edit product action
    // does not reliably land on the intended row).
    const switchClient = await createClient(page, project, {
      name: unique('Autotest Edit Channel Client'),
    });
    switchClientName = switchClient.name;

    const switchProduct = await createProduct(page, project, {
      name: unique('Autotest Edit Channel Product'),
      clientName: switchClientName,
    });
    switchProductName = switchProduct.name;

    const channelC = await createMarketingChannel(page, project, { name: unique(CHANNEL_NAME) });
    channelCName = channelC.name;
  });

  test('01. Edit channel name and cost', async ({ page, project }) => {
    await login(page);

    const updatedName = `${channelAName} Edited`;

    await editMarketingChannel(page, project, channelAName, {
      name: updatedName,
      cost: '5200',
    });
    channelAName = updatedName;

    await expect(await getChannelRow(page, channelAName)).toBeVisible({ timeout: 15000 });
  });

  test('02. Edit channel client connection and conversion rate', async ({ page, project }) => {
    await login(page);

    // Switching the Client connection also requires switching to the
    // Product it's attached to (see setup test's comment).
    await editMarketingChannel(page, project, channelBName, {
      product: switchProductName,
      client: switchClientName,
      conversionRate: '9',
    });

    const row = await getChannelRow(page, channelBName);
    await expect(row).toBeVisible({ timeout: 15000 });
  });

  test('03. Edit channel strategy and quantity', async ({ page, project }) => {
    await login(page);

    await editMarketingChannel(page, project, channelCName, {
      strategy: 'Updated strategy created by the automated test suite.',
      quantity: '20000',
    });

    await expect(await getChannelRow(page, channelCName)).toBeVisible({ timeout: 15000 });
  });
});
