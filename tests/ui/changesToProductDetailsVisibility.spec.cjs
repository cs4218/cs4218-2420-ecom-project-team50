import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const originalData = {
  nameOnAdminPage: 'Novel Novel A bestselling',
  updatedNameOnAdminPage: '',
  name: 'Novel',
  detail: 'A bestselling novel',
  price: '14.99',
};

async function loginAsAdmin(page) {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
}

async function navigateToProductEdit(page) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Products' }).click();
  await page.waitForTimeout(1000);
  if (originalData.updatedNameOnAdminPage !== '') {
    await page.getByRole('link', { name: originalData.updatedNameOnAdminPage }).click();
  }
  else {   
    await page.getByRole('link', { name: originalData.nameOnAdminPage }).click();
    originalData.nameOnAdminPage = 'Novel Novel A bestselling';
  }
  await page.waitForTimeout(1000);
}

async function checkAsRegularUser(page, updatedData) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.waitForTimeout(1000);

  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@gmail.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);

  await expect(page.getByRole('heading', { name: updatedData.name })).toBeVisible();  
  
  if (originalData.name !== updatedData.name) {
    await expect(page.getByRole('heading', { name: originalData.name, exact: true })).toHaveCount(0);
  }
}

async function logoutAsAdminAndloginAsUser(page) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.waitForTimeout(1000);

  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@gmail.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
}

async function resetProductData(page) {
  await loginAsAdmin(page);
  await navigateToProductEdit(page);
  originalData.updatedNameOnAdminPage = '';
  
  await page.getByRole('textbox', { name: 'write a name' }).fill(originalData.name);
  
  await page.getByRole('textbox', { name: 'write a description' }).fill(originalData.detail);
  
  await page.getByPlaceholder('write a Price').fill(originalData.price);
  
  await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
  await page.waitForTimeout(1000);
}

test.describe('Product Management Tests', () => {
  test.afterEach(async ({ page }) => {
    await resetProductData(page);
  });

  test('change product name', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProductEdit(page);

    const newProductName = 'Novel: Disappearing Earth';
    await page.getByRole('textbox', { name: 'write a name' }).fill(newProductName);
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await page.waitForTimeout(1000);
    originalData.updatedNameOnAdminPage = newProductName;

    await page.getByRole('link', { name: 'Home' }).click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByRole('heading', { name: newProductName })).toBeVisible();
    
    await expect(page.getByRole('heading', { name: originalData.name, exact: true })).toHaveCount(0);
    
    await checkAsRegularUser(page, { name: newProductName });
  });

  test('change product detail', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProductEdit(page);

    const newDetail = 'This is updated description of the bestselling novel';
    await page.getByRole('textbox', { name: 'write a description' }).fill(newDetail);
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForTimeout(1000);
    
    
    const detailLocator = page.getByText(newDetail, { exact: true });
    await expect(detailLocator).toBeVisible(); 
    
    const oldDetailLocator = page.getByText(originalData.detail, { exact: true });
    await expect(oldDetailLocator).toHaveCount(0);

    
    await page.getByRole('link', { name: 'Home' }).click();
    await logoutAsAdminAndloginAsUser(page);
    
    const nextNextSibling = page.getByTestId(originalData.name);
    await nextNextSibling.click();

    await page.waitForTimeout(1000);
    await expect(page.getByText(`Description : ${newDetail}`, { exact: true })).toBeVisible();

    originalData.nameOnAdminPage = 'Novel Novel This is updated'
  });

  test('change product price', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToProductEdit(page);

    const newPrice = '39.99';
    await page.getByPlaceholder('write a Price').fill(newPrice);
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: originalData.name }).click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByPlaceholder('write a Price')).toHaveValue(newPrice);
    
    await expect(page.getByText(`${originalData.price}`, { exact: true })).toHaveCount(0);
    
    await page.getByRole('link', { name: 'Home' }).click();
    await logoutAsAdminAndloginAsUser(page);   
    
    const nextNextSibling = page.getByTestId(originalData.name);
    await nextNextSibling.click();

    await page.waitForTimeout(1000);
    await expect(page.getByText(`Price :$${newPrice}`, { exact: true })).toBeVisible();
  });
});