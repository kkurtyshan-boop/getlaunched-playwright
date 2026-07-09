import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'Dior Brand';

const MVPS = [
  {
    name: 'AR Virtual Try-On Prototype',
    type: 'Prototype',
    segment: 'Makeup-ентузіасти Dior (20-45) _test',
    hypothesisIf:
      'we build an AR virtual try-on tool for lipstick and foundation shades',
    hypothesisThen:
      'users will engage more with the product catalog and add more items to their wishlist',
    hypothesisBecause:
      'customers hesitate to purchase makeup online without seeing how shades look on their skin',
    feature: {
      name: 'AR shade matching',
      type: 'Core',
      description: 'Real-time camera-based shade try-on for lips and face products.',
    },
    validation: {
      successMetric: 'Wishlist add rate',
      targetValue: '> 15%',
      timeFrame: '30 days',
    },
  },
  {
    name: 'Limited Edition Fragrance Pre-Order',
    type: 'Test sales',
    segment: 'Преміум-колекціонери ароматів (15-35) _test',
    hypothesisIf:
      'we open pre-orders for a limited edition fragrance before the full launch',
    hypothesisThen:
      'a meaningful share of loyal customers will commit to a purchase in advance',
    hypothesisBecause:
      'premium fragrance collectors respond strongly to exclusivity and scarcity',
    feature: {
      name: 'Pre-order landing page',
      type: 'Core',
      description: 'Dedicated page to collect pre-orders with a deposit payment.',
    },
    validation: {
      successMetric: 'Pre-order conversion rate',
      targetValue: '> 10%',
      timeFrame: '14 days',
    },
  },
  {
    name: 'Boutique Personal Styling Pilot',
    type: 'Pilot project',
    segment: 'Покупці "подарунків" (усі вікові) _test',
    hypothesisIf:
      'we offer a free personal styling consultation in two flagship boutiques',
    hypothesisThen:
      'customers will increase their average basket size during the visit',
    hypothesisBecause:
      'personalized guidance increases confidence in higher-value purchases',
    feature: {
      name: 'In-store styling booking',
      type: 'Core',
      description: 'Appointment booking system for personal styling sessions.',
    },
    validation: {
      successMetric: 'Average basket size',
      targetValue: '+20%',
      timeFrame: '60 days',
    },
  },
  {
    name: 'Sustainable Packaging Awareness Landing Page',
    type: 'Landing page',
    segment: 'Покупці "подарунків" (усі вікові) _test',
    hypothesisIf:
      'we publish a landing page highlighting our new recyclable packaging initiative',
    hypothesisThen:
      'visitors will sign up for updates on the sustainable product line',
    hypothesisBecause:
      'gift buyers increasingly value environmentally responsible brands',
    feature: {
      name: 'Email signup form',
      type: 'Core',
      description: 'Capture emails for updates on the sustainable packaging launch.',
    },
    validation: {
      successMetric: 'Signup conversion rate',
      targetValue: '> 8%',
      timeFrame: '21 days',
    },
  },
  {
    name: 'Fragrance Notes Explainer Video',
    type: 'Explanatory video',
    segment: 'Засоби для догляду за "ідеальною" шкірою... _test',
    hypothesisIf:
      'we publish a short video explaining how to choose fragrance notes for your skin type',
    hypothesisThen:
      'viewers will spend more time browsing the perfume catalog afterward',
    hypothesisBecause:
      'customers often feel overwhelmed by fragrance terminology',
    feature: {
      name: 'Embedded video widget',
      type: 'Core',
      description: 'Short explainer video embedded on the perfume category page.',
    },
    validation: {
      successMetric: 'Post-video catalog engagement',
      targetValue: '> 25%',
      timeFrame: '30 days',
    },
  },
];

async function login(page) {
  await page.goto('https://frontv2.getlaunched.io/sign-in', {
    waitUntil: 'domcontentloaded',
  });

  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();
  const signInButton = page.getByRole('button', { name: /sign in/i }).first();

  await expect(email).toBeVisible({ timeout: 15000 });
  await email.fill('kataratest573@gmail.com');

  await expect(password).toBeVisible({ timeout: 15000 });
  await password.fill('Test_11K');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
    signInButton.click(),
  ]);

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await expect(page).not.toHaveURL(/\/sign-in/i);
}

async function openMvpTab(page) {
  await page.goto('https://frontv2.getlaunched.io/', {
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

  const implementationTab = page.getByRole('tab', { name: /^implementation$/i }).first();
  if (await implementationTab.isVisible().catch(() => false)) {
    await implementationTab.click();
  } else {
    const implementationLink = page.getByRole('link', { name: /^implementation$/i }).first();
    await expect(implementationLink).toBeVisible({ timeout: 15000 });
    await implementationLink.click();
  }

  await expect(
    page.getByRole('heading', { name: /implementation/i }).first()
  ).toBeVisible({ timeout: 15000 });

  const mvpTab = page.getByRole('tab', { name: /^mvp$/i }).first();
  await expect(mvpTab).toBeVisible({ timeout: 15000 });
  await mvpTab.click();
  await page.waitForTimeout(500);
}

async function selectFromCustomDropdown(page, scope, dropdownIndex, optionLabel, exact = true) {
  const dropdownButton = scope.locator('button[data-open="false"]').nth(dropdownIndex);

  await expect(dropdownButton).toBeVisible({ timeout: 15000 });
  await dropdownButton.scrollIntoViewIfNeeded();
  await dropdownButton.click();

  const listbox = page.getByRole('listbox').last();
  await expect(listbox).toBeVisible({ timeout: 15000 });

  const option = listbox.getByRole('option', { name: optionLabel, exact }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
}

// Create MVP is a dedicated page (not a modal). "Create MVP" stays visible on
// the MVP list page after each creation, so it can be re-clicked for the next one.
async function createMvp(page, mvp) {
  const createMvpButton = page.getByRole('button', { name: /^create mvp$/i }).first();
  await expect(createMvpButton).toBeVisible({ timeout: 15000 });
  await createMvpButton.click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);

  const nameField = page.getByPlaceholder('Type MVP Name...').first();
  await expect(nameField).toBeVisible({ timeout: 15000 });
  await nameField.fill(mvp.name);

  // Dropdown positions: Type(0), Target segment(1), Feature Type(2)
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

  const submitButton = page.getByRole('button', { name: /^create mvp$/i }).last();
  await expect(submitButton).toBeVisible({ timeout: 15000 });
  await submitButton.click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  await expect(
    page.getByRole('heading', { name: mvp.name, exact: true }).first()
  ).toBeVisible({ timeout: 15000 });
}

test.describe.serial('MVP flow', () => {
  test('01. Create an MVP for all 5 types', async ({ page }) => {
    // 5 MVPs, each a long multi-section form — well beyond the default 30s timeout
    test.setTimeout(300_000);

    await login(page);
    await openMvpTab(page);

    for (const mvp of MVPS) {
      await createMvp(page, mvp);
    }
  });
});
