import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:3000';
test.describe.configure({ mode: 'serial' });

function generateUniqueCategoryName() {
  return `Test Category ${Date.now()}`;
}

const newCategoryName = generateUniqueCategoryName();

async function loginAsAdmin(page) {
  await page.goto(`${baseUrl}/login`);
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
}

async function loginAsUser(page) {
  await page.goto(`${baseUrl}/login`);
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@gmail.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
}

async function logout(page) {
  const accountButton = page.getByRole('button', { name: /CS 4218 Test Account|test@gmail.com/ });
  if (await accountButton.isVisible()) {
    await accountButton.click();
    await page.getByRole('link', { name: 'Logout' }).click();
    await page.waitForTimeout(1000);
  }
}

async function createCategory(page, categoryName) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();

  await page.getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill(categoryName);
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(2000);

  await expect(page.getByText(`${categoryName} is created`)).toBeVisible();
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

async function deleteCategory(page, categoryName) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.waitForTimeout(1000);

  const categoryIndex = await findCategoryIndex(page, categoryName);
  
  if (categoryIndex === -1) {
    console.warn(`Category "${categoryName}" not found for deletion`);
    return false;
  }

  await page.getByRole('button', { name: 'Delete' }).nth(categoryIndex).click();
  await page.waitForTimeout(1000);
  
  // Verify deletion by checking that the category is no longer visible
  const categoryRowAfterDeletion = page.getByRole('cell', { name: categoryName });
  try {
    await expect(categoryRowAfterDeletion).not.toBeVisible({ timeout: 2000 });
  } catch (e) {
    console.warn(`Verification failed, category "${categoryName}" might still be present`);
    return false;
  }

  const successMessage = page.getByText('Category is deleted');
  await expect(successMessage).toBeVisible();
  
  return true;
}

async function verifyCategoryInFilters(page, categoryName) {
  await page.goto(baseUrl);
  await page.waitForTimeout(1000);

  const categoryCheckbox = page.getByRole('checkbox', { name: categoryName });
  await expect(categoryCheckbox).toBeVisible();
}

async function verifyCategoryInDropdown(page, categoryName) {
  await page.goto(baseUrl);
  await page.waitForTimeout(1000);

  // Open categories dropdown
  await page.getByRole('link', { name: 'Categories' }).click();
  await page.waitForTimeout(1000); // Wait for dropdown to fully appear
  await expect(page.getByRole('link', { name: categoryName })).toBeVisible();
}

async function verifyCategoryInAllCategories(page, categoryName) {
  await page.goto(baseUrl);
  await page.waitForTimeout(1000);

  await page.getByRole('link', { name: 'Categories' }).click();
  await page.getByRole('link', { name: 'All Categories' }).click();
  await page.waitForTimeout(1000);

  await expect(page.getByRole('link', { name: categoryName })).toBeVisible();
}

test.describe('Category Creation Visibility Tests', () => {
  let mainPage;

  test.beforeAll(async ({ browser }) => {
    // Create a shared page to use across all tests
    mainPage = await browser.newPage();

    await loginAsAdmin(mainPage);
    await createCategory(mainPage, newCategoryName);
  });

  test.afterAll(async () => {
    await loginAsAdmin(mainPage);
    await deleteCategory(mainPage, newCategoryName);

    await mainPage.close();
  });

  test('newly created category is visible in home page filters for admin', async ({ page }) => {
    await loginAsAdmin(page);
    await verifyCategoryInFilters(page, newCategoryName);
  });

  test('newly created category is visible in categories dropdown for admin', async ({ page }) => {
    await loginAsAdmin(page);
    await verifyCategoryInDropdown(page, newCategoryName);
  });

  test('newly created category is visible in All Categories page for admin', async ({ page }) => {
    await loginAsAdmin(page);
    await verifyCategoryInAllCategories(page, newCategoryName);
  });

  test('newly created category is visible in home page filters for regular user', async ({ page }) => {
    await loginAsUser(page);
    await verifyCategoryInFilters(page, newCategoryName);
  });

  test('newly created category is visible in categories dropdown for regular user', async ({ page }) => {
    await loginAsUser(page);
    await verifyCategoryInDropdown(page, newCategoryName);
  });

  test('newly created category is visible in All Categories page for regular user', async ({ page }) => {
    await loginAsUser(page);
    await verifyCategoryInAllCategories(page, newCategoryName);
  });
});

test('create a unique category for independent testing', async ({ page }) => {
  const uniqueCategoryName = `Independent Category`;
  
  await loginAsAdmin(page);
  await createCategory(page, uniqueCategoryName);
  
  await verifyCategoryInFilters(page, uniqueCategoryName);
  await verifyCategoryInDropdown(page, uniqueCategoryName);
  await verifyCategoryInAllCategories(page, uniqueCategoryName);
  
  await logout(page);
  await loginAsUser(page);
  
  await verifyCategoryInFilters(page, uniqueCategoryName);
  await verifyCategoryInDropdown(page, uniqueCategoryName);
  await verifyCategoryInAllCategories(page, uniqueCategoryName);
  
  await logout(page);
  await loginAsAdmin(page);
  await deleteCategory(page, uniqueCategoryName);
});