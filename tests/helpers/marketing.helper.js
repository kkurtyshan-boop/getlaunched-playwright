import { expect } from '@playwright/test';
import { gotoOperations } from './navigation';
import { CHANNEL_NAME, unique } from '../config';
import { createClient } from './client.helper';
import { createProduct } from './product.helper';

// Operations renders Marketing channels / Team and staff / Resources / Other
// as TABS on one page rather than separate URLs. "Marketing channels" is the
// default tab, but the app has been observed to land on whichever tab was
// last active in a prior session instead of the default — click the tab
// button explicitly rather than relying on the default.
export async function gotoMarketingChannels(page, project) {
  await gotoOperations(page, project);

  const tab = page.getByRole('tab', { name: /^marketing channels$/i }).first();
  await expect(tab).toBeVisible({ timeout: 15000 });
  await tab.click();

  await expect(page.getByRole('button', { name: /^create channel$/i }).first()).toBeVisible({
    timeout: 15000,
  });
}

export async function openCreateChannelModal(page) {
  const createChannelButton = page.getByRole('button', { name: /^create channel$/i }).first();
  await expect(createChannelButton).toBeVisible({ timeout: 15000 });
  await createChannelButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

// The app-wide custom dropdown pattern (CLAUDE.md "Selectors & waits"):
// button[data-open="false"] -> listbox -> option. Step 1 of the channel
// wizard has three of these in order: Category (index 0), then a "Business
// unit" pair — Product (index 1) and Client connection (index 2, disabled
// until a Product is chosen). NOTE: PROJECT_KNOWLEDGE.md previously
// documented Step 1 as just Category + Client — live-checked here and the
// wizard actually requires a Product ("Business unit") selection too, with
// Client connection gated on it; see the in-file comment on fillChannelStep.
export async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel) {
  const dropdownButton = scope.locator('button[data-open="false"]').nth(dropdownIndex);

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: optionLabel, exact: true }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();

  // Wait for the listbox to actually close before returning — without this,
  // a dropdown opened moments later in the same modal can race against this
  // one's still-closing listbox and resolve getByRole('listbox').last() to
  // the wrong element.
  await expect(listbox).not.toBeVisible({ timeout: 5000 }).catch(() => {});
}

// Fills Step 1 ("Channel name" / Category / Business unit (Product + Client
// connection) / Strategy) of the create/edit wizard. `channel.category`
// selects the Category dropdown option; `channel.customCategoryName`, if
// set, fills the free-text field that only appears when Category = "Other"
// (see BUG_PATTERNS.md — custom "Other" category names permanently pollute
// the shared per-project dropdown, so callers should avoid inventing a
// fresh one on every run). `channel.product` MUST be selected before
// `channel.client` — the live app disables the "Client connection" dropdown
// until a Product ("Business unit") is chosen.
export async function fillChannelStep(page, modal, channel) {
  if (channel.name) {
    const nameField = modal.getByPlaceholder('Type channel name').first();
    await expect(nameField).toBeVisible({ timeout: 15000 });
    await nameField.fill(channel.name);
  }

  if (channel.category) {
    await selectFromCustomDropdown(page, modal, 0, channel.category);

    if (channel.customCategoryName) {
      const customCategoryField = modal.getByPlaceholder(/type category name/i).first();
      await expect(customCategoryField).toBeVisible({ timeout: 15000 });
      await customCategoryField.fill(channel.customCategoryName);
    }
  }

  if (channel.product) {
    await selectFromCustomDropdown(page, modal, 1, channel.product);
  }

  if (channel.client) {
    await selectFromCustomDropdown(page, modal, 2, channel.client);
  }

  if (channel.strategy) {
    const strategyField = modal.getByPlaceholder('Write your story...').first();
    await expect(strategyField).toBeVisible({ timeout: 15000 });
    await strategyField.fill(channel.strategy);
  }
}

export async function goToSalesFunnelsStep(modal) {
  const nextButton = modal.getByRole('button', { name: /^next$/i }).first();

  await expect(nextButton).toBeVisible({ timeout: 15000 });
  await nextButton.click();

  // A fresh channel's Sales Funnels step always starts with exactly one
  // funnel stage — wait for the funnel-builder step to actually render.
  await expect(modal.getByText(/build your sales funnel/i)).toBeVisible({ timeout: 15000 });
}

// Fills the first funnel stage only (Quantity / Cost (optional) /
// Conversion rate,%). Adding further stages via "Add funnel step" is not
// covered here — see BUG_PATTERNS.md "Sales Funnels Step Redesigned..." for
// the full shape.
export async function fillSalesFunnelsStep(modal, channel) {
  if (channel.quantity) {
    const quantityField = modal.getByPlaceholder('Type quantity').first();
    await expect(quantityField).toBeVisible({ timeout: 15000 });
    await quantityField.fill(channel.quantity);
  }

  if (channel.cost) {
    const costField = modal.getByPlaceholder('Type cost').first();
    await expect(costField).toBeVisible({ timeout: 15000 });
    await costField.fill(channel.cost);
  }

  if (channel.conversionRate) {
    const conversionRateField = modal.getByPlaceholder('0').first();
    await expect(conversionRateField).toBeVisible({ timeout: 15000 });
    await conversionRateField.fill(channel.conversionRate);
  }
}

// Creates a marketing channel via the real UI 2-step wizard and returns the
// fixture used. If no `overrides.client`/`overrides.product` is given, a
// fresh Client and Product are created first (both are required links: a
// "Business unit" Product and a Client connection gated on it) and their
// names are used.
export async function createMarketingChannel(page, project, overrides = {}) {
  let clientName = overrides.client;
  if (!clientName) {
    const client = await createClient(page, project);
    clientName = client.name;
  }

  let productName = overrides.product;
  if (!productName) {
    // The "Client connection" dropdown only lists clients already attached
    // to the chosen Product ("Business unit") — attach the client here so
    // it actually appears as a selectable option (live-checked: an
    // unattached product renders "No clients yet" in that dropdown).
    const product = await createProduct(page, project, { clientName });
    productName = product.name;
  }

  const channel = {
    name: overrides.name || unique(CHANNEL_NAME),
    category: overrides.category || 'Social Media',
    product: productName,
    client: clientName,
    strategy: overrides.strategy || 'Strategy created by the automated test suite.',
    quantity: overrides.quantity || '10000',
    cost: overrides.cost || '5000',
    conversionRate: overrides.conversionRate || '5',
    customCategoryName: overrides.customCategoryName,
  };

  await gotoMarketingChannels(page, project);
  const modal = await openCreateChannelModal(page);

  await fillChannelStep(page, modal, channel);
  await goToSalesFunnelsStep(modal);
  await fillSalesFunnelsStep(modal, channel);

  const createButton = modal.getByRole('button', { name: /^create$/i }).last();
  await expect(createButton).toBeVisible({ timeout: 15000 });
  await createButton.click();

  // The modal closing is a far more specific success signal than matching
  // loose text anywhere in <body> (the page already contains words like
  // "created"/"added" elsewhere, e.g. client-count badges).
  await expect(modal).not.toBeVisible({ timeout: 15000 });

  return channel;
}

// List view is a TABLE (not cards) — locate a channel's row by its unique
// name rather than assuming position.
export async function getChannelRow(page, channelName) {
  const row = page.locator('tr').filter({ hasText: channelName }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  return row;
}

async function openRowActionsMenu(page, channelName) {
  const row = await getChannelRow(page, channelName);
  await row.scrollIntoViewIfNeeded();

  const actionButton = row.getByRole('button', { name: /open actions menu/i }).first();
  await expect(actionButton).toBeVisible({ timeout: 15000 });
  await actionButton.click();

  return row;
}

export async function openEditChannelModal(page, channelName) {
  await openRowActionsMenu(page, channelName);

  const editItem = page.getByRole('menuitem', { name: /^edit$/i }).first();
  await expect(editItem).toBeVisible({ timeout: 15000 });
  await editItem.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  return modal;
}

export async function submitChannelUpdate(modal) {
  const updateButton = modal.getByRole('button', { name: /^update$/i }).first();
  await expect(updateButton).toBeVisible({ timeout: 15000 });
  await updateButton.click();

  await expect(modal).not.toBeVisible({ timeout: 15000 });
}

// Opens the edit wizard for `channelName`, applies only the fields present
// in `changes` (Step 1 fields via fillChannelStep, Step 2 funnel fields via
// fillSalesFunnelsStep — only visiting Step 2 if a funnel field changed),
// then submits. Returns the (possibly renamed) channel name to assert on.
export async function editMarketingChannel(page, project, channelName, changes = {}) {
  await gotoMarketingChannels(page, project);
  const modal = await openEditChannelModal(page, channelName);

  await fillChannelStep(page, modal, changes);

  if (changes.quantity || changes.cost || changes.conversionRate) {
    await goToSalesFunnelsStep(modal);
    await fillSalesFunnelsStep(modal, changes);
  }

  await submitChannelUpdate(modal);

  return changes.name || channelName;
}
