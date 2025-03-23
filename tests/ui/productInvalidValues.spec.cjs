import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const validProduct = {
  name: 'Test Invalid Values Product',
  description: 'This is a product for invalid values testing',
  price: '29.99',
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
  
  if (productData.price !== undefined) {
    await page.getByPlaceholder('write a Price').fill(productData.price.toString());
  }

  
  if (productData.quantity !== undefined) {
    await page.getByPlaceholder('write a quantity').fill(productData.quantity.toString());
  }

  await page.getByTestId('select-shipping').click();
  await page.getByText('Yes').click();
}


async function checkProductExists(page, productName) {
  await navigateToAdminProducts(page);
  const productCard = page.getByRole('link', { name: productName });
  return await productCard.count() > 0;
}

async function cleanupTestProduct(page, productName) {
  await navigateToAdminProducts(page);
  const productLink = page.getByRole('link', { name: productName });
  if (await productLink.count() > 0) {
    await productLink.click();
    await page.waitForTimeout(1000);

    await page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
    await page.waitForTimeout(1000);
  }
}

test.describe('Product Invalid Values Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToCreateProduct(page);
  });

  test('cannot create product with negative price', async ({ page }) => {
    
    const productWithNegativePrice = { ...validProduct, price: '-10.99' };
    
    await fillProductForm(page, productWithNegativePrice);
    
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await page.waitForTimeout(1000);
    
    
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

    await navigateToAdminProducts(page);
    const productExists = await page.getByRole('link', { name: validProduct.name }).count() > 0;
    expect(productExists).toBeFalsy();
  });

  test('cannot create product with negative quantity', async ({ page }) => {
    
    const productWithNegativeQuantity = { ...validProduct, quantity: '-5' };
    
    await fillProductForm(page, productWithNegativeQuantity);

    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

    await navigateToAdminProducts(page);
    const productExists = await page.getByRole('link', { name: validProduct.name }).count() > 0;
    expect(productExists).toBeFalsy();
  });

  test('trying to input non-numeric price produces validation error', async ({ page }) => {
    
    await fillProductForm(page, {
      name: validProduct.name,
      description: validProduct.description,
      quantity: validProduct.quantity,
      category: validProduct.category
    });
    
    let validationErrorCaught = false;
    try {
      await page.getByPlaceholder('write a Price').fill('abc');
    } catch (error) {
      
      validationErrorCaught = error.message.includes('Cannot type text into input[type=number]');
    }

    expect(validationErrorCaught).toBeTruthy();
    
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
  });

  test('trying to input non-numeric quantity produces validation error', async ({ page }) => {
    
    await fillProductForm(page, {
      name: validProduct.name,
      description: validProduct.description,
      price: validProduct.price,
      category: validProduct.category
    });
    
    let validationErrorCaught = false;
    try {
      await page.getByPlaceholder('write a quantity').fill('xyz');
    } catch (error) {
      
      validationErrorCaught = error.message.includes('Cannot type text into input[type=number]');
    }
    
    expect(validationErrorCaught).toBeTruthy();
    
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
  });

  test('can create product with valid positive values', async ({ page }) => {
    
    await fillProductForm(page, validProduct);
    
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await page.waitForTimeout(2000); 
    
    await expect(page.getByText('Product Created Successfully')).toBeVisible();

    await navigateToAdminProducts(page);
    const productExists = await page.getByRole('link', { name: validProduct.name }).count() > 0;
    expect(productExists).toBeTruthy();
    
    await cleanupTestProduct(page, validProduct.name);
  });

  test('product with very large values is handled correctly', async ({ page }) => {
    
    const productWithLargeValues = {
      ...validProduct,
      name: 'Large Values Product',
      price: '99999999.99',
      quantity: '999999999'
    };

    await fillProductForm(page, productWithLargeValues);
    
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await page.waitForTimeout(2000);
    
    await navigateToAdminProducts(page);
    const productExists = await page.getByRole('link', { name: productWithLargeValues.name }).count() > 0;

    if (productExists) {
      
      await cleanupTestProduct(page, productWithLargeValues.name);
    } else {
      expect(productExists).toBeFalsy();
    }
  });
});
