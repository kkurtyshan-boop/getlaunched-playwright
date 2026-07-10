import { test, expect } from '@playwright/test';
import { login, PROJECT_NAME } from './helpers';


const IP_TYPES = [
  {
    name: 'Trademark',
    registrationStatus: 'Registered',
    notes:
      'Торгова марка Dior та логотип зареєстровані у ЄС, США та Японії, регулярно оновлюється захист у нових регіонах.',
  },
  {
    name: 'Patent',
    registrationStatus: 'Pending',
    notes:
      'Патентна заявка на технологію стійкої формули аромату подана, очікує розгляду патентного відомства.',
  },
  {
    name: 'Copyright',
    registrationStatus: 'Registered',
    notes:
      'Авторські права на дизайн упаковки, рекламні кампанії та візуальний контент бренду зареєстровано.',
  },
  {
    name: 'Design',
    registrationStatus: 'Registered',
    notes:
      'Промисловий дизайн флаконів парфумів та фірмових коробок захищено як зареєстрований промисловий зразок.',
  },
];

const LOCATIONS = [
  { name: 'Paris Flagship District', address: '30 Avenue Montaigne, Paris, France' },
  { name: 'New York Fifth Avenue', address: '724 Fifth Avenue, New York, USA' },
  { name: 'Tokyo Ginza', address: '5-4-1 Ginza, Chuo City, Tokyo, Japan' },
];

const LOCATION_CRITERIA = [
  { name: 'Rent affordability', weight: '6' },
  { name: 'Foot traffic', weight: '9' },
  { name: 'Brand prestige fit', weight: '10' },
];

// One score array per criterion above, values ordered to match LOCATIONS.
const LOCATION_MATRIX_SCORES = [
  ['4', '3', '5'],
  ['9', '10', '8'],
  ['10', '9', '9'],
];

const SUPPLIERS = [
  { name: 'Grasse Essence Co.', email: 'contact@grasseessence.fr', country: 'France' },
  { name: 'Milano Packaging Group', email: 'sales@milanopack.it', country: 'Italy' },
  { name: 'Lyon Glass Manufacturing', email: 'info@lyonglass.fr', country: 'France' },
];

const SUPPLIER_CRITERIA = [
  { name: 'Quality reliability', weight: '10' },
  { name: 'Cost competitiveness', weight: '6' },
  { name: 'Sustainability practices', weight: '7' },
];

const SUPPLIER_MATRIX_SCORES = [
  ['9', '8', '9'],
  ['5', '7', '6'],
  ['8', '6', '7'],
];
async function openOtherTab(page) {
  await page.goto('/', {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const projectCard = page.getByText(PROJECT_NAME, { exact: true }).first();
  await expect(projectCard).toBeVisible({ timeout: 15000 });
  await projectCard.scrollIntoViewIfNeeded();
  await projectCard.click();

  const operationsLink = page.getByRole('link', { name: /^operations$/i }).first();
  await expect(operationsLink).toBeVisible({ timeout: 15000 });
  await operationsLink.click();

  await expect(
    page.getByRole('heading', { name: /^operations$/i }).first()
  ).toBeVisible({ timeout: 15000 });

  const otherTab = page.getByRole('tab', { name: /^other$/i }).first();
  await expect(otherTab).toBeVisible({ timeout: 15000 });
  await otherTab.click();
}

async function expandAccordionSection(page, sectionName) {
  const region = page.getByRole('region', { name: new RegExp(sectionName, 'i') }).first();

  if (!(await region.isVisible().catch(() => false))) {
    const header = page.getByRole('button', { name: new RegExp(sectionName, 'i') }).first();
    await expect(header).toBeVisible({ timeout: 15000 });
    await header.click();
    await page.waitForTimeout(300);
  }

  await expect(region).toBeVisible({ timeout: 15000 });
  return region;
}

async function selectFromCustomDropdown(page, scope, optionLabel) {
  const dropdownButton = scope.locator('button[data-open="false"]').first();

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox
    .getByRole('option', { name: optionLabel, exact: true })
    .first();

  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
}

// The IP Rights panel swaps content in place based on the selected nav
// button (Trademark/Patent/Copyright/Design), so only one panel is ever
// rendered — page-level selectors are unambiguous.
async function fillIpType(page, ipType) {
  const typeButton = page
    .getByRole('button', { name: new RegExp(`^${ipType.name}\\b`) })
    .first();
  await expect(typeButton).toBeVisible({ timeout: 15000 });
  await typeButton.click();
  await page.waitForTimeout(300);

  const trackedSwitch = page.getByRole('switch').first();
  await expect(trackedSwitch).toBeVisible({ timeout: 15000 });
  const isChecked = await trackedSwitch.isChecked();
  if (!isChecked) {
    await trackedSwitch.click();
    await page.waitForTimeout(300);
  }

  await selectFromCustomDropdown(page, page, ipType.registrationStatus);

  const notesField = page.getByPlaceholder('Type text').first();
  await expect(notesField).toBeVisible({ timeout: 15000 });
  await notesField.fill(ipType.notes);

  const saveButton = page.getByRole('button', { name: /^save$/i }).first();
  await expect(saveButton).toBeVisible({ timeout: 15000 });
  await saveButton.click();
  await page.waitForTimeout(500);
}

async function addLocation(page, region, location) {
  const addButton = region.locator('button:right-of(:text("Locations"))').first();
  await expect(addButton).toBeVisible({ timeout: 15000 });
  await addButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  await modal.getByPlaceholder('Type name').fill(location.name);
  await modal.getByPlaceholder('Type address').fill(location.address);

  await modal.getByRole('button', { name: /^create$/i }).click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function addSupplier(page, region, supplier) {
  const addButton = region.locator('button:right-of(:text("Suppliers"))').first();
  await expect(addButton).toBeVisible({ timeout: 15000 });
  await addButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  await modal.getByPlaceholder('Type name').fill(supplier.name);
  await modal.getByPlaceholder('Type email').fill(supplier.email);
  await modal.getByPlaceholder('Type country').fill(supplier.country);

  await modal.getByRole('button', { name: /^create$/i }).click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function addAnalysisCriterion(page, region, criterion) {
  const addButton = region
    .locator('button:right-of(:text("Criteria Configuration"))')
    .first();
  await expect(addButton).toBeVisible({ timeout: 15000 });
  await addButton.click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 15000 });

  await modal.getByPlaceholder('Type name').fill(criterion.name);
  await modal.getByRole('radio', { name: criterion.weight, exact: true }).click();

  await modal.getByRole('button', { name: /^create$/i }).click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function setMatrixScore(page, region, criterionName, columnIndex, score) {
  const row = region
    .locator('tbody tr')
    .filter({ has: page.getByText(criterionName, { exact: true }) })
    .first();

  await expect(row).toBeVisible({ timeout: 15000 });

  const cell = row.locator('td').nth(columnIndex + 1);
  const trigger = cell.locator('button').first();

  await expect(trigger).toBeVisible({ timeout: 15000 });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await page.waitForTimeout(300);

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: score, exact: true }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
  await page.waitForTimeout(300);

  await expect(trigger).toContainText(score, { timeout: 15000 });
}

test.describe.serial('Other (Operations) flow', () => {
  test('01. Track and fill all intellectual property rights types', async ({ page }) => {
    // 4 IP types saved sequentially — exceeds the default 30s timeout
    test.setTimeout(120_000);

    await login(page);
    await openOtherTab(page);

    for (const ipType of IP_TYPES) {
      await fillIpType(page, ipType);
    }
  });

  test('02. Fill location analysis: locations, criteria and comparison matrix', async ({ page }) => {
    // 3 locations + 3 criteria + 9 matrix cells — exceeds the default 30s timeout
    test.setTimeout(240_000);

    await login(page);
    await openOtherTab(page);

    const region = await expandAccordionSection(page, 'Location Analysis');

    for (const location of LOCATIONS) {
      await addLocation(page, region, location);
    }

    for (const criterion of LOCATION_CRITERIA) {
      await addAnalysisCriterion(page, region, criterion);
    }

    for (let ci = 0; ci < LOCATION_CRITERIA.length; ci++) {
      const criterion = LOCATION_CRITERIA[ci];
      const scores = LOCATION_MATRIX_SCORES[ci];

      for (let li = 0; li < scores.length; li++) {
        await setMatrixScore(page, region, criterion.name, li, scores[li]);
      }
    }
  });

  test('03. Fill supplier analysis: suppliers, criteria and comparison matrix', async ({ page }) => {
    // 3 suppliers + 3 criteria + 9 matrix cells — exceeds the default 30s timeout
    test.setTimeout(240_000);

    await login(page);
    await openOtherTab(page);

    const region = await expandAccordionSection(page, 'Supplier Analysis');

    for (const supplier of SUPPLIERS) {
      await addSupplier(page, region, supplier);
    }

    for (const criterion of SUPPLIER_CRITERIA) {
      await addAnalysisCriterion(page, region, criterion);
    }

    for (let ci = 0; ci < SUPPLIER_CRITERIA.length; ci++) {
      const criterion = SUPPLIER_CRITERIA[ci];
      const scores = SUPPLIER_MATRIX_SCORES[ci];

      for (let li = 0; li < scores.length; li++) {
        await setMatrixScore(page, region, criterion.name, li, scores[li]);
      }
    }
  });
});
