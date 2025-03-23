import { test, expect } from '@playwright/test';

function generateUniqueProductName() {
  return `Test Product UI`;
}

const newProduct = {
  name: generateUniqueProductName(),
  description: 'This is a test product created by UI automation',
  price: '29.99',
  quantity: '100',
  category: 'Electronics' 
};

async function loginAsAdmin(page) {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
}

async function navigateToCreateProduct(page) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.waitForTimeout(1000);
}

async function navigateToAdminProducts(page) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Products' }).click();
  await page.waitForTimeout(1000);
}

async function loginAsRegularUser(page) {
  
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000); 
  
  const accountButton = page.locator('button:has-text("CS 4218 Test Account"), .nav-link:has-text("CS 4218 Test Account")');
  const loginLink = page.getByRole('link', { name: 'Login' });
  
  if (await accountButton.isVisible()) {
    console.log('Logging out current user...');
    await accountButton.click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Logout' }).click();
    await page.waitForTimeout(2000); 
  } else if (!(await loginLink.isVisible())) {
    
    console.log('Page state unclear, refreshing...');
    await page.reload();
    await page.waitForTimeout(2000);
  }
  
  console.log('Logging in as regular user...');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@gmail.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(2000); 
}

async function cleanupExistingProducts(page) {
  await loginAsAdmin(page);
  await navigateToAdminProducts(page);  
  
  const testProducts = page.getByRole('link', { name: /Test Product UI/ });
  const count = await testProducts.count();
  console.log(`Found ${count} existing test products to clean up`);
  
  for (let i = 0; i < count; i++) {
    
    const product = page.getByRole('link', { name: /Test Product UI/ }).first();
    await product.click();
    await page.waitForTimeout(1000);  
    
    await page.once('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });  
    
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
    await page.waitForTimeout(1500);  
    
    if (i < count - 1) {
      await navigateToAdminProducts(page);
      await page.waitForTimeout(1000);
    }
  }
}

async function createTestProduct(page) {
  await navigateToCreateProduct(page);
  
  console.log(`Creating test product: ${newProduct.name}`);
  
  await page.getByTestId('select-category').click();
  await page.getByTitle(newProduct.category).click();
  
  await page.getByRole('textbox', { name: 'write a name' }).fill(newProduct.name);
  
  await page.getByRole('textbox', { name: 'write a description' }).fill(newProduct.description);
  
  await page.getByPlaceholder('write a Price').fill(newProduct.price);
  
  await page.getByPlaceholder('write a quantity').fill(newProduct.quantity);
  
  await page.getByTestId('select-shipping').click();
  await page.getByText('Yes').click();
  
  await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
  await page.waitForTimeout(2000); 
}


async function deleteTestProduct(page) {
  await loginAsAdmin(page);
  await navigateToAdminProducts(page);
  
  const productLink = page.getByRole('link', { name: newProduct.name });
  if (await productLink.count() > 0) {
    await productLink.click();
    await page.waitForTimeout(1000);

    await page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      
      await dialog.accept();
    });
    
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
    await page.waitForTimeout(1000);
  }
}

test.describe('Product Creation and Visibility Tests', () => {
  test.beforeAll(async ({ browser }) => {
    
    const page = await browser.newPage();
    await loginAsAdmin(page);
    
    await cleanupExistingProducts(page); 
    
    await createTestProduct(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    
    const page = await browser.newPage();
    await cleanupExistingProducts(page); 
    await page.close();
  });

  test('1. newly created product is visible to admin in Products page', async ({ page }) => {
    
    await loginAsAdmin(page);
    
    await navigateToAdminProducts(page);
    
    const adminProductCard = page.getByRole('link', { name: newProduct.name }).first();
    await expect(adminProductCard).toBeVisible();
  });

  test('2. newly created product is visible to admin in Home page', async ({ page }) => {
    
    await loginAsAdmin(page);
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    
    const productCard = page.getByText(newProduct.name);
    await expect(productCard).toBeVisible();
  });

  test('3. newly created product is visible to user in Home page', async ({ page }) => {
    
    await loginAsRegularUser(page);
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);

    const userProductCard = page.getByText(newProduct.name);
    await expect(userProductCard).toBeVisible();
    
    await page.getByTestId(newProduct.name).click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByRole('heading', { name: newProduct.name })).toBeVisible();
    await expect(page.getByText(`Description : ${newProduct.description}`)).toBeVisible();
    await expect(page.getByText(`Price :$${newProduct.price}`)).toBeVisible();
  });
});
