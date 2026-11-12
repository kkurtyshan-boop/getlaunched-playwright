import { test, expect } from './fixtures/project.fixture';
import { login } from './helpers';
import { unique } from './config';
import {
  saveIpRight,
  IP_STATUS,
  openOtherTab,
  expandAccordionSection,
  createLocation,
  createSupplier,
  createAnalysisCriterion,
  openCardEditModal,
  submitSubsectionUpdate,
  supplierEmailField,
  supplierCountryField,
  setSupplierCountry,
} from './helpers/other.helper';

// Self-contained: creates its own Patent record, Location (+criterion), and
// Supplier (+criterion) via helpers/other.helper.js instead of depending on
// 18-create-other.spec.js having run first (test.describe.serial + `let`,
// per tests/07-edit-product-add-delete-client.spec.js).
test.describe.serial('Edit other (Operations) flow', () => {
  let locationName;
  let locationCriterionName;
  let supplierName;
  let supplierCriterionName;

  test('00. Set up a patent, a location with a criterion, and a supplier with a criterion', async ({
    page,
    project,
  }) => {
    // Patent save + location/criterion + supplier/criterion — exceeds the default 30s timeout.
    test.setTimeout(180_000);
    await login(page);

    await saveIpRight(page, project, {
      type: 'Patent',
      status: IP_STATUS.have,
      stage: 'Filed',
      registrationNumber: 'EP-AUTOTEST-001',
      description: unique('Application filed for the core product formula; awaiting review.'),
    });

    const location = await createLocation(page, project, { name: unique('Autotest Edit Location') });
    locationName = location.name;

    const locationRegion = await expandAccordionSection(page, /Location Analysis/i);
    const locationCriterion = await createAnalysisCriterion(page, locationRegion, {
      name: unique('Autotest Edit Location Criterion'),
      weight: '6',
    });
    locationCriterionName = locationCriterion.name;

    const supplier = await createSupplier(page, project, { name: unique('Autotest Edit Supplier') });
    supplierName = supplier.name;

    const supplierRegion = await expandAccordionSection(page, /Supplier Analysis/i);
    const supplierCriterion = await createAnalysisCriterion(page, supplierRegion, {
      name: unique('Autotest Edit Supplier Criterion'),
      weight: '7',
    });
    supplierCriterionName = supplierCriterion.name;
  });

  test('01. Edit patent stage and description', async ({ page, project }) => {
    test.setTimeout(90_000);
    await login(page);

    // saveIpRight reloads and asserts the nav badge, the Stage dropdown and
    // the description — a real persistence check, not just that it submitted.
    await saveIpRight(page, project, {
      type: 'Patent',
      status: IP_STATUS.have,
      stage: 'Granted',
      description: unique('Patent granted; protection valid for 20 years.'),
    });
  });

  test('02. Edit a location and a location criterion weight', async ({ page, project }) => {
    test.setTimeout(60_000);
    await login(page);
    await openOtherTab(page, project);
    const region = await expandAccordionSection(page, /Location Analysis/i);

    const updatedLocationName = unique('Autotest Edit Location Updated');
    const locationModal = await openCardEditModal(page, region, locationName);
    await locationModal.getByPlaceholder('Type name').fill(updatedLocationName);
    await locationModal.getByPlaceholder('Type address').fill('99 Renewed Avenue, Springfield');
    await submitSubsectionUpdate(locationModal);

    await expect(locationModal).not.toBeVisible({ timeout: 15000 });
    await expect(region.getByRole('heading', { name: updatedLocationName, exact: true })).toBeVisible({
      timeout: 15000,
    });
    locationName = updatedLocationName;

    const criterionModal = await openCardEditModal(page, region, locationCriterionName);
    await criterionModal.getByRole('radio', { name: '8', exact: true }).click();
    await submitSubsectionUpdate(criterionModal);
    await expect(criterionModal).not.toBeVisible({ timeout: 15000 });

    const criterionCard = region.locator('li').filter({
      has: page.getByRole('heading', { name: locationCriterionName, exact: true }),
    }).first();
    await expect(criterionCard).toContainText('8', { timeout: 15000 });
  });

  test('03. Edit a supplier and a supplier criterion weight', async ({ page, project }) => {
    test.setTimeout(60_000);
    await login(page);
    await openOtherTab(page, project);
    const region = await expandAccordionSection(page, /Supplier Analysis/i);

    const updatedEmail = 'updated.supplier@autotest.example.com';
    const updatedCountry = 'Netherlands';
    const supplierModal = await openCardEditModal(page, region, supplierName);
    await supplierEmailField(supplierModal).fill(updatedEmail);
    await setSupplierCountry(page, supplierModal, updatedCountry);
    await submitSubsectionUpdate(supplierModal);

    await expect(supplierModal).not.toBeVisible({ timeout: 15000 });
    // The supplier card renders Name + Country + Role (2026-11 — Email is no
    // longer shown there), so verify Country on the card and Email by
    // reopening the edit form.
    const supplierCard = region.locator('li').filter({
      has: page.getByRole('heading', { name: supplierName, exact: true }),
    }).first();
    await expect(supplierCard).toContainText(updatedCountry, { timeout: 15000 });

    const reopenedSupplierModal = await openCardEditModal(page, region, supplierName);
    await expect(supplierCountryField(reopenedSupplierModal)).toHaveValue(updatedCountry, { timeout: 15000 });
    await expect(supplierEmailField(reopenedSupplierModal)).toHaveValue(updatedEmail, { timeout: 15000 });
    await reopenedSupplierModal.getByRole('button', { name: /close|cancel/i }).first().click().catch(() => page.keyboard.press('Escape'));
    await expect(reopenedSupplierModal).not.toBeVisible({ timeout: 10000 }).catch(() => {});

    const criterionModal = await openCardEditModal(page, region, supplierCriterionName);
    await criterionModal.getByRole('radio', { name: '8', exact: true }).click();
    await submitSubsectionUpdate(criterionModal);
    await expect(criterionModal).not.toBeVisible({ timeout: 15000 });

    const criterionCard = region.locator('li').filter({
      has: page.getByRole('heading', { name: supplierCriterionName, exact: true }),
    }).first();
    await expect(criterionCard).toContainText('8', { timeout: 15000 });
  });
});
