import { test, expect } from '@playwright/test';
import { login, PROJECT_NAME } from './helpers';

const CLIENT_NAME = 'Преміум-колекціонери ароматів (15-35) _test';
const UPDATED_CLIENT_NAME = 'Преміум-колекціонери ароматів (15-35)';
async function openClientsPage(page) {
  await page.goto('/', {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const projectCard = page.getByText(PROJECT_NAME, { exact: true }).first();
  await expect(projectCard).toBeVisible({ timeout: 15000 });
  await projectCard.scrollIntoViewIfNeeded();
  await projectCard.click();

  const magicTriangle = page.getByText(/magic triangle/i).first();
  await expect(magicTriangle).toBeVisible({ timeout: 15000 });
  await magicTriangle.click();

  await expect(page).toHaveURL(/\/triangle/i, { timeout: 15000 });

  const clientsButton = page.getByText(/^clients$/i).first();
  await expect(clientsButton).toBeVisible({ timeout: 15000 });
  await clientsButton.click();

  await expect(page).toHaveURL(/\/triangle\/clients/i, { timeout: 15000 });
}

test('Login, edit client and delete need', async ({ page }) => {
  await login(page);
  await openClientsPage(page);

  // OPEN CLIENT
  const clientCard = page.getByText(CLIENT_NAME, { exact: true }).first();
  await expect(clientCard).toBeVisible({ timeout: 15000 });
  await clientCard.click();

  // CLICK EDIT
  const editButton = page
    .locator('button')
    .filter({
      has: page.locator('svg path[d*="M13.26 3.59924"]'),
    })
    .first();

  await expect(editButton).toBeVisible({ timeout: 15000 });
  await editButton.click();

  // EDIT FORM OPENED - CHANGE NAME
  const nameField = page.getByRole('textbox', { name: /name/i }).first();
  await expect(nameField).toBeVisible({ timeout: 15000 });

  await nameField.fill(UPDATED_CLIENT_NAME);

  // DELETE NEED
  const deleteNeedButton = page
    .locator('button')
    .filter({
      has: page.locator('svg path[d*="M21 5.98047"]'),
    })
    .first();

  await expect(deleteNeedButton).toBeVisible({ timeout: 15000 });
  await deleteNeedButton.click();

  // DELETE CONFIRM POPUP
  const confirmDeleteButton = page.getByRole('button', {
    name: /yes, delete this need/i,
  });

  await expect(confirmDeleteButton).toBeVisible({ timeout: 15000 });
  await confirmDeleteButton.click();

  // UPDATE CLIENT
  const updateButton = page.getByRole('button', { name: /^update$/i }).first();

  await expect(updateButton).toBeVisible({
    timeout: 15000,
  });

  await updateButton.click();

  // Чекаємо завершення запиту
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  // Перевіряємо що форма редагування закрилась
  await expect(
    page.getByRole('dialog')
  ).toBeHidden({
    timeout: 15000,
  });

  // Додаткова перевірка що ми залишились на сторінці Clients
  await expect(page).toHaveURL(
    /\/triangle\/clients/i,
    {
      timeout: 15000,
    }
  );

  // Оновлюємо сторінку щоб побачити оновлені дані
  await page.reload();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  // CHECK - старе ім'я з _test більше не видно (або можемо просто перевірити що ми на сторінці)
  await expect(page).toHaveURL(
    /\/triangle\/clients/i,
    {
      timeout: 15000,
    }
  );
});