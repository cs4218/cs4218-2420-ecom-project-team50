import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const validProduct = {
  name: 'Test Validation Product',
  description: 'This is a product for validation testing',
  price: '19.99',
  quantity: '50',
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

async function fillProductForm(page, productData) {
  
  if (productData.category) {
    await page.getByTestId('select-category').click();
    await page.getByTitle(productData.category).click();
  }
  
  if (productData.name) {
    await page.getByRole('textbox', { name: 'write a name' }).fill(productData.name);
  }
  
  if (productData.description) {
    await page.getByRole('textbox', { name: 'write a description' }).fill(productData.description);
  }
  
  if (productData.price) {
    await page.getByPlaceholder('write a Price').fill(productData.price);
  }
  
  if (productData.quantity) {
    await page.getByPlaceholder('write a quantity').fill(productData.quantity);
  }
  
  await page.getByTestId('select-shipping').click();
  await page.getByText('Yes').click();
}


async function checkProductExists(page, productName) {
  await navigateToAdminProducts(page);
  const productCard = page.getByRole('link', { name: productName });
  return await productCard.count() > 0;
}

test.describe('Product Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToCreateProduct(page);
  });

  test('cannot create product with missing name', async ({ page }) => {
    const productWithoutName = { ...validProduct };
    delete productWithoutName.name;

    await fillProductForm(page, productWithoutName);

    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    await expect(page.getByText('Name, Description, Price, Quantity and Category is required')).toBeVisible();

    await navigateToAdminProducts(page);
    const productExists = await page.getByText(validProduct.description).count() > 0;
    expect(productExists).toBeFalsy();
  });

  test('cannot create product with missing description', async ({ page }) => {
    const productWithoutDescription = { ...validProduct };
    delete productWithoutDescription.description;
    
    await fillProductForm(page, productWithoutDescription);

    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    await expect(page.getByText('Name, Description, Price, Quantity and Category is required')).toBeVisible();

    await navigateToAdminProducts(page);
    const productExists = await page.getByRole('link', { name: validProduct.name }).count() > 0;
    expect(productExists).toBeFalsy();
  });

  test('cannot create product with missing price', async ({ page }) => {
    
    const productWithoutPrice = { ...validProduct };
    delete productWithoutPrice.price;
    
    await fillProductForm(page, productWithoutPrice);
    
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    
    await expect(page.getByText('Name, Description, Price, Quantity and Category is required')).toBeVisible();
    
    await navigateToAdminProducts(page);
    const productExists = await page.getByRole('link', { name: validProduct.name }).count() > 0;
    expect(productExists).toBeFalsy();
  });

  test('cannot create product with missing quantity', async ({ page }) => {
    const productWithoutQuantity = { ...validProduct };
    delete productWithoutQuantity.quantity;

    await fillProductForm(page, productWithoutQuantity);
    
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    
    await expect(page.getByText('Name, Description, Price, Quantity and Category is required')).toBeVisible();
    
    await navigateToAdminProducts(page);
    const productExists = await page.getByRole('link', { name: validProduct.name }).count() > 0;
    expect(productExists).toBeFalsy();
  });

  test('cannot create product with missing category', async ({ page }) => {
    
    const productWithoutCategory = { ...validProduct };
    delete productWithoutCategory.category;
    
    await fillProductForm(page, productWithoutCategory);
    
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    
    await expect(page.getByText('Name, Description, Price, Quantity and Category is required')).toBeVisible();
    
    await navigateToAdminProducts(page);
    const productExists = await page.getByRole('link', { name: validProduct.name }).count() > 0;
    expect(productExists).toBeFalsy();
  });

  test('can create product with all required fields', async ({ page }) => {
    
    await fillProductForm(page, validProduct);
    
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await page.waitForTimeout(2000); 
    
    await expect(page.getByText('Product Created Successfully')).toBeVisible();
    
    await navigateToAdminProducts(page);
    const productExists = await page.getByRole('link', { name: validProduct.name }).count() > 0;
    expect(productExists).toBeTruthy();
    
    if (productExists) {
      await page.getByRole('link', { name: validProduct.name }).click();
      await page.waitForTimeout(1000);

      await page.on('dialog', async dialog => {
        await dialog.accept();
      });

      await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
      await page.waitForTimeout(1000);
    }
  });
});
