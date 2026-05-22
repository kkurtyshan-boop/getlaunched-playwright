import { test, expect } from '@playwright/test';

test('Login and create client', async ({ page }) => {
  // LOGIN
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

  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page).not.toHaveURL(/\/sign-in/i);

  // OPEN PROJECTS PAGE
  await page.goto('https://frontv2.getlaunched.io/', {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForLoadState('networkidle').catch(() => {});

  // OPEN PROJECT
  const projectCard = page.getByText(
    'Updated Business 1779445669432',
    { exact: true }
  ).first();

  await expect(projectCard).toBeVisible({ timeout: 15000 });
  await projectCard.scrollIntoViewIfNeeded();
  await projectCard.click();

  // OPEN MAGIC TRIANGLE
  const magicTriangle = page.getByText(/magic triangle/i).first();
  await expect(magicTriangle).toBeVisible({ timeout: 15000 });
  await magicTriangle.click();

  await expect(page).toHaveURL(/\/triangle/i, {
    timeout: 15000,
  });

  // OPEN CLIENTS
  const clientsButton = page.getByText(/^clients$/i).first();
  await expect(clientsButton).toBeVisible({ timeout: 15000 });
  await clientsButton.click();

  await expect(page).toHaveURL(/\/triangle\/clients/i, {
    timeout: 15000,
  });

  // OPEN CREATE CLIENT MODAL
  const createClientButton = page.getByRole('button', { name: /^create client$/i });
  await expect(createClientButton).toBeVisible({ timeout: 15000 });
  await createClientButton.click();

  const createClientModal = page.getByRole('dialog');
  await expect(createClientModal).toBeVisible({ timeout: 15000 });

  // FILL CLIENT NAME
  const clientName = page.getByRole('textbox', { name: /name/i }).first();
  const clientDescription = page.getByRole('textbox', { name: /description/i }).first();

  const clientNameValue = `Client ${Date.now()}`;

  await expect(clientName).toBeVisible({ timeout: 15000 });
  await clientName.fill(clientNameValue);

  if (await clientDescription.count()) {
    await clientDescription.fill('Client description for autotest');
  }

  // ADD NEED
  const addNeedButton = page.getByRole('button').filter({ hasText: '+' }).first();
  await expect(addNeedButton).toBeVisible({ timeout: 15000 });
  await addNeedButton.click();

  // FILL NEED
  const needInput = page.getByRole('textbox').last();
  await expect(needInput).toBeVisible({ timeout: 15000 });
  await needInput.fill('Fast support');

  // PRIORITY
  const priorityDropdown = page.getByText(/priority/i).first();
  await expect(priorityDropdown).toBeVisible({ timeout: 15000 });
  await priorityDropdown.click();

  await page.getByRole('option', { name: /high/i }).click();

  // SATISFACTION
  const satisfactionDropdown = page.getByText(/satisfaction/i).first();
  await expect(satisfactionDropdown).toBeVisible({ timeout: 15000 });
  await satisfactionDropdown.click();

  await page.getByRole('option', { name: /fully/i }).click();

  // CREATE CLIENT
  const submitButton = page.getByRole('button', { name: /^create$/i }).last();
  await expect(submitButton).toBeVisible({ timeout: 15000 });
  await submitButton.click();

  // SUCCESS CHECK
  await expect(page.locator('body')).toContainText(/client|success/i, {
    timeout: 15000,
  });

  await expect(page.locator('body')).toContainText(clientNameValue);
});