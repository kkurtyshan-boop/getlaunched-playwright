import { test, expect } from '@playwright/test';

// Use saved authenticated storage if present to avoid flaky UI login
try {
  test.use({ storageState: 'storageState.json' });
} catch (e) {
  // ignore if runner doesn't support file-level use
}

const PROJECT_NAME = 'Dior Brand';

// ДАНІ ЗІ СКРІНШОТІВ ДЛЯ СТВОРЕННЯ КЛІЄНТІВ
const CLIENTS_DATA = [
  {
    name: 'Преміум-колекціонери ароматів (15-35)',
    description: 'Охоче купують парфуми Dior, цікавляться новинками та лімітованими колекціями. Важливі стійкість аромату, оригінальність та "ефект вау" від знайомства з новими нотами.',
    needs: [
      { name: 'Парфуми 1 сегменту', priority: 'Low', satisfaction: 'Not Satisfied' },
      { name: 'Парфуми 2-го сегменту', priority: 'High', satisfaction: 'Partially Satisfied' },
      { name: 'Парфуми 3-го сегменту', priority: 'Critical', satisfaction: 'Fully Satisfied' },
      { name: 'Парфуми 4-го сегменту', priority: 'Critical', satisfaction: 'Fully Satisfied' },
      { name: 'Парфуми 5-го сегменту', priority: 'Critical', satisfaction: 'Fully Satisfied' }
    ]
  },
  {
    name: 'Засоби для догляду за "ідеальною" шкірою...',
    description: 'Шукають креми/сироватки Dior для зволоження, відновлення та anti-age. Потрібні відчутний ефект, підбір під тип шкіри та консультація спеціаліста.',
    needs: [
      { name: 'Парфуми 1 сегменту', priority: 'High', satisfaction: 'Fully Satisfied' },
      { name: 'Парфуми 2-го сегменту', priority: 'Critical', satisfaction: 'Not Satisfied' }
    ]
  },
  {
    name: 'Makeup-ентузіасти Dior (20-45)',
    description: 'Вибирають тон, туш, помади/блиски для щодня та подій. Важливі відтінки, комфорт на шкірі, стійкість та якість текстур.',
    needs: [
      { name: 'Парфуми 1 сегменту', priority: 'High', satisfaction: 'Fully Satisfied' }
    ]
  },
  {
    name: 'Покупці "подарунків" (усі вікові)',
    description: 'Купують Dior набори та gift-версії для свят і подій. Важливі комплектація, брендинг/упаковка, швидкий вибір і "гарантований вау-ефект".',
    needs: [] // 0 Потреб — кнопка додавання клікатися не буде
  }
];

async function login(page) {
  // LOGIN
  await page.goto('https://frontv2.getlaunched.io/sign-in', {
    waitUntil: 'domcontentloaded',
  });

  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();
  const signInButton = page
    .getByRole('button', { name: /sign in/i })
    .first();

  // If storageState logged-in, the sign-in form won't be present — skip login
  try {
    await expect(email).toBeVisible({ timeout: 2000 });
  } catch {
    return; // already logged in
  }

  await email.fill('kataratest573@gmail.com');

  await expect(password).toBeVisible({
    timeout: 15000,
  });

  await password.fill('Test_11K');

  // Try submitting the form with Enter first, then fallback to clicking the button
  await password.press('Enter').catch(() => {});

  try {
    await expect(
      page.getByRole('heading', { name: /select a project/i }).first()
    ).toBeVisible({ timeout: 10000 });
  } catch (err) {
    await signInButton.click();
    try {
      await expect(
        page.getByRole('heading', { name: /select a project/i }).first()
      ).toBeVisible({ timeout: 20000 });
    } catch (err2) {
      // diagnostics: capture screenshot and page info
      await page.screenshot({ path: 'tmp/login-failure.png', fullPage: true }).catch(() => {});
      const url = page.url();
      const body = await page.locator('body').innerText().catch(() => '');
      const info = `URL: ${url}\n\nBODY:\n${body.slice(0,2000)}`;
      const fs = require('fs');
      try { fs.writeFileSync('tmp/login-failure.txt', info); } catch(e){}
      throw new Error('Login failed — screenshot and page dump saved to tmp/login-failure.*');
    }
  }

  await expect(page).not.toHaveURL(/\/sign-in/i, { timeout: 30000 });
}

async function openClientsPage(page) {
  // OPEN PROJECTS PAGE
  await page.goto('https://frontv2.getlaunched.io/', {
    waitUntil: 'domcontentloaded',
  });

  // Сайт постійно робить фонові запити (нотифікації тощо), тому networkidle
  // ніколи не настає — обмежуємо очікування, щоб воно не зжирало весь таймаут тесту.
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  // Wait for projects view header
  await expect(page.getByRole('heading', { name: /select a project/i }).first()).toBeVisible({ timeout: 20000 });

  // Try to find the project by exact name, then fallback to partial match or card search
  let projectCard = page.getByText(PROJECT_NAME, { exact: true }).first();

  try {
    await expect(projectCard).toBeVisible({ timeout: 8000 });
  } catch {
    // fallback: search for partial match (e.g., 'Dior')
    projectCard = page.locator('li').filter({ hasText: new RegExp(PROJECT_NAME.split(' ')[0], 'i') }).first();
    try {
      await expect(projectCard).toBeVisible({ timeout: 8000 });
    } catch {
      // final fallback: any element that contains the project name substring
      projectCard = page.locator(`:text-matches("${PROJECT_NAME.split(' ')[0]}", "i")`).first();
      try {
        await expect(projectCard).toBeVisible({ timeout: 5000 });
      } catch (err) {
        // capture screenshot and dump DOM to help debugging
        await page.screenshot({ path: 'tmp/client-open-failure.png', fullPage: true }).catch(() => {});
        throw new Error('Project card not found for ' + PROJECT_NAME + ' — screenshot saved to tmp/client-open-failure.png');
      }
    }
  }

  await projectCard.scrollIntoViewIfNeeded();
  await projectCard.click();

  // OPEN MAGIC TRIANGLE
  const magicTriangle = page
    .getByText(/magic triangle/i)
    .first();

  await expect(magicTriangle).toBeVisible({
    timeout: 15000,
  });

  await magicTriangle.click();

  await expect(page).toHaveURL(
    /\/triangle/i,
    {
      timeout: 15000,
    }
  );

  // OPEN CLIENTS
  const clientsButton = page
    .getByText(/^clients$/i)
    .first();

  await expect(clientsButton).toBeVisible({
    timeout: 15000,
  });

  await clientsButton.click();

  await expect(page).toHaveURL(
    /\/triangle\/clients/i,
    {
      timeout: 15000,
    }
  );
}

async function openCreateClientModal(page) {
  // OPEN CREATE CLIENT MODAL
  const createClientButton = page.getByRole(
    'button',
    { name: /^create client$/i }
  );

  await expect(createClientButton).toBeVisible({
    timeout: 15000,
  });

  await createClientButton.click();

  const modal = page.getByRole('dialog');

  await expect(modal).toBeVisible({
    timeout: 15000,
  });

  return modal;
}

async function selectDropdown(page, modal, needIndex, isSecond, optionName) {
  // Знаходимо поле вводу назви потреби за індексом
  const needNameInput = modal.getByPlaceholder('Type need name').nth(needIndex);
  
  // Знаходимо батьківський контейнер потреби, піднімаючись вверх по DOM через XPath
  const needBlock = needNameInput.locator('xpath=ancestor::div[contains(@class, "flex")]');
  
  // Знаходимо всі кнопки Select всередину цього блоку потреби
  const selectButtons = needBlock.getByRole('button').filter({ hasText: 'Select' });
  
  // Перший Select - це Priority, другий - Satisfaction
  const selectIndex = isSecond ? 1 : 0;
  const dropdown = selectButtons.nth(selectIndex);

  await expect(dropdown).toBeVisible({
    timeout: 15000,
  });

  await dropdown.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await dropdown.click();

  await page.waitForTimeout(500);

  const option = page.getByRole('option', {
    name: new RegExp(optionName, 'i'),
  });

  await expect(option.first()).toBeVisible({
    timeout: 15000,
  });

  await option.first().click();
  
  await page.waitForTimeout(300);
}

test.describe.serial('Create client flow', () => {

  // ТВІЙ РОБОЧИЙ ПЕРШИЙ ТЕСТ
  test('01. Validation for empty client form', async ({ page }) => {

    await login(page);

    await openClientsPage(page);

    const modal = await openCreateClientModal(page);

    // CLICK CREATE WITHOUT DATA
    const createButton = modal
      .getByRole('button', { name: /^create$/i })
      .last();

    await expect(createButton).toBeVisible({
      timeout: 15000,
    });

    await createButton.click();

    // VALIDATION CHECK
    await expect(
      page.getByText(
        /must be at least 2 characters|required/i
      ).first()
    ).toBeVisible({
      timeout: 15000,
    });

    // Очищення сцени: закриваємо модалку кнопкою закриття
    const closeButton = modal.getByRole('button', { name: /close/i }).first();
    await closeButton.click();
  });

  // ТВІЙ ДРУГИЙ ТЕСТ (Оновлений під створення 4-х клієнтів з реальними даними)
  for (const client of CLIENTS_DATA) {
    test(`02. Create client: ${client.name}`, async ({ page }) => {

      await login(page);

      await openClientsPage(page);

      const modal = await openCreateClientModal(page);

      // CLIENT NAME
      const clientName = modal
        .getByPlaceholder('Type client name')
        .first();

      await expect(clientName).toBeVisible({
        timeout: 15000,
      });

      // Залишаємо реальне ім'я зі скріншоту, але додаємо позначку тесту
      const clientNameValue = `${client.name} _test`;

      await clientName.fill(clientNameValue);

      // DESCRIPTION
      const description = modal
        .getByPlaceholder('Write your story...')
        .first();

      await expect(description).toBeVisible({
        timeout: 15000,
      });

      await description.fill(client.description);

      // ДОДАВАННЯ ТА ЗАПОВНЕННЯ ПОТРЕБ ЗА СКРІНШОТАМИ
      for (let i = 0; i < client.needs.length; i++) {
        if (i === 0) {
          // Для найпершої потреби клікаємо велику кнопку по центру (Скріншот 2)
          const firstAddButton = modal.getByRole('button', { name: /Add needs/i });
          await expect(firstAddButton).toBeVisible({ timeout: 15000 });
          await firstAddButton.click();
        } else {
          // Для другої та наступних потреб — тиснемо на малий плюс (+) у правому кутку
          const plusButton = modal.locator('button.text-primary:has(svg)').last();

          await expect(plusButton).toBeVisible({
            timeout: 15000,
          });

          await plusButton.click();
        }

        // Заповнюємо назву поточної потреби через її індекс
        const needNameField = modal.getByPlaceholder('Type need name').nth(i);
        await expect(needNameField).toBeVisible({ timeout: 15000 });
        await needNameField.fill(client.needs[i].name);

        // Пріоритет
        await selectDropdown(page, modal, i, false, client.needs[i].priority);

        // Задоволеність
        await selectDropdown(page, modal, i, true, client.needs[i].satisfaction);
      }

      // CREATE CLIENT
      const createButton = modal
        .getByRole('button', { name: /^create$/i })
        .last();

      await expect(createButton).toBeVisible({
        timeout: 15000,
      });

      await createButton.click();

      // SUCCESS CHECK
      await expect(
        page.locator('body')
      ).toContainText(
        clientNameValue,
        {
          timeout: 15000,
        }
      );
    });
  }
});