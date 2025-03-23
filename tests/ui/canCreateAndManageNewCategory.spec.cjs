import { test, expect } from '@playwright/test';

const testData = {
  initialCategory: `Test Category ${Date.now()}`,
  updatedName: `Updated Category ${Date.now()}`,
  existingCategory: 'Electronics' // Assuming this category already exists
};

async function loginAsAdmin(page) {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
}

async function navigateToCreateCategory(page) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.waitForTimeout(1000);
}

// Find the index of a category in the table
async function findCategoryIndex(page, categoryName) {
  const rows = await page.locator('tbody tr').all();
  for (let i = 0; i < rows.length; i++) {
    const text = await rows[i].textContent();
    if (text.includes(categoryName)) {
      return i;
    }
  }
  return -1; // Category not found
}

// Configure the test suite to run tests serially (in sequence)
test.describe.configure({ mode: 'serial' });

test.describe('Category Management Tests', () => {
  test('admin can create new category successfully', async ({ page }) => {
    await loginAsAdmin(page);
    await createCategory(page, testData.initialCategory);

    const categoryRow = page.getByRole('cell', { name: testData.initialCategory });
    await expect(categoryRow).toBeVisible();
  });

  test('admin cannot edit this new category to name of existing category', async ({ page }) => {
    await loginAsAdmin(page);

    await navigateToCreateCategory(page);

    const categoryIndex = await findCategoryIndex(page, testData.initialCategory);
    await page.getByRole('button', { name: 'Edit' }).nth(categoryIndex).click();
    await page.waitForTimeout(500);

    await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).click();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill(testData.existingCategory);
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);

    const errorMessage = page.getByText(`Category "${testData.existingCategory}" already exists`);
    await expect(errorMessage).toBeVisible();

    // Close the modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('admin can edit this new category to new name', async ({ page }) => {
    await loginAsAdmin(page);

    await navigateToCreateCategory(page);

    const categoryIndex = await findCategoryIndex(page, testData.initialCategory);
    await page.getByRole('button', { name: 'Edit' }).nth(categoryIndex).click();
    await page.waitForTimeout(500);

    await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).click();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill(testData.updatedName);
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(2000);

    const successMessage = page.getByText(`${testData.updatedName} is updated`);
    await expect(successMessage).toBeVisible();
    await page.waitForTimeout(1000);

    const updatedCategoryRow = page.getByRole('cell', { name: testData.updatedName });
    await expect(updatedCategoryRow).toBeVisible();

    const originalCategoryRow = page.getByRole('cell', { name: testData.initialCategory });
    await expect(originalCategoryRow).not.toBeVisible();
  });

  test('admin can delete this new category', async ({ page }) => {
    await loginAsAdmin(page);

    await navigateToCreateCategory(page);

    const categoryIndex = await findCategoryIndex(page, testData.updatedName);
    await page.getByRole('button', { name: 'Delete' }).nth(categoryIndex).click();
    await page.waitForTimeout(1000);

    const categoryRowAfterDeletion = page.getByRole('cell', { name: testData.updatedName });
    await expect(categoryRowAfterDeletion).not.toBeVisible();

    const successMessage = page.getByText('Category is deleted');
    await expect(successMessage).toBeVisible();
  });
});

async function createCategory(page, categoryName) {
  await navigateToCreateCategory(page);
  await page.getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill(categoryName);
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(1000);
}