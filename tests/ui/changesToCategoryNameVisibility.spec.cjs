import { test, expect } from '@playwright/test';

const testData = {
  initialCategory: `Test Category`,
  updatedCategory: `Updated Category`
};

async function loginAsAdmin(page) {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
}

async function loginAsUser(page) {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@gmail.com');
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

async function createTestCategory(page) {
  await navigateToCreateCategory(page);
  
  await page.getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill(testData.initialCategory);
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(1000);
  
  const categoryRow = page.getByRole('cell', { name: testData.initialCategory });
  await expect(categoryRow).toBeVisible();
}

async function updateCategoryName(page) {
  await navigateToCreateCategory(page);

  const categoryIndex = await findCategoryIndex(page, testData.initialCategory);
  await page.getByRole('button', { name: 'Edit' }).nth(categoryIndex).click();
  await page.waitForTimeout(500);
  
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill(testData.updatedCategory);
  await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(1000);

  const successMessage = page.getByText(`${testData.updatedCategory} is updated`);
  await expect(successMessage).toBeVisible();
}

async function deleteTestCategory(page, categoryName) {
  await navigateToCreateCategory(page);

  const categoryIndex = await findCategoryIndex(page, categoryName);
  if (categoryIndex >= 0) {
    await page.getByRole('button', { name: 'Delete' }).nth(categoryIndex).click();
    await page.waitForTimeout(1000);
  }
}

test.describe('Category Name Change Tests', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await createTestCategory(page);
    await updateCategoryName(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await deleteTestCategory(page, testData.updatedCategory);
    await page.close();
  });

  test('category name change is visible to regular users', async ({ page }) => {
    await loginAsUser(page);
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    
    const updatedCategoryCheckbox = page.getByRole('checkbox', { name: testData.updatedCategory });
    await expect(updatedCategoryCheckbox).toBeVisible();
    
    const originalCategoryCheckbox = page.getByRole('checkbox', { name: testData.initialCategory });
    await expect(originalCategoryCheckbox).not.toBeVisible();
  });

  test('category name change appears on home page filters', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);

    const updatedCategoryCheckbox = page.getByRole('checkbox', { name: testData.updatedCategory });
    await expect(updatedCategoryCheckbox).toBeVisible();
  });

  test('category name change appears in categories dropdown', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);

    await page.getByRole('link', { name: 'Categories' }).click();
    await page.waitForTimeout(500);

    const updatedCategoryLink = page.getByRole('link', { name: testData.updatedCategory });
    await expect(updatedCategoryLink).toBeVisible();
    
    const originalCategoryLink = page.getByRole('link', { name: testData.initialCategory });
    await expect(originalCategoryLink).not.toBeVisible();
  });

  test('category name change appears in All Categories page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'All Categories' }).click();
    await page.waitForTimeout(1000);

    const updatedCategoryButton = page.getByRole('link', { name: testData.updatedCategory });
    await expect(updatedCategoryButton).toBeVisible();

    const originalCategoryButton = page.getByRole('link', { name: testData.initialCategory });
    await expect(originalCategoryButton).not.toBeVisible();

    await updatedCategoryButton.click();
    await page.waitForTimeout(1000);

    const categoryHeading = page.getByText(`Category - ${testData.updatedCategory}`);
    await expect(categoryHeading).toBeVisible();
  });
});