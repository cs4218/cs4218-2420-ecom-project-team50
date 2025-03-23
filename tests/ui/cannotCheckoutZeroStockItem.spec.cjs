import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:3000';




const zeroStockProduct = {
  name: 'Zero Stock Product',
  description: 'This product has zero stock for testing checkout restrictions',
  price: '29.99',
  quantity: '0',
  category: 'Electronics' 
};


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


async function createZeroStockProduct(page) {
  await navigateToCreateProduct(page);

  
  await page.getByTestId('select-category').click();
  await page.getByTitle(zeroStockProduct.category).click();

  
  await page.getByRole('textbox', { name: 'write a name' }).fill(zeroStockProduct.name);

  
  await page.getByRole('textbox', { name: 'write a description' }).fill(zeroStockProduct.description);

  
  await page.getByPlaceholder('write a Price').fill(zeroStockProduct.price);

  
  await page.getByPlaceholder('write a quantity').fill(zeroStockProduct.quantity);

  
  await page.getByTestId('select-shipping').click();
  await page.getByText('Yes').click();

  
  await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
  await page.waitForTimeout(2000); 
}


async function deleteZeroStockProduct(page) {
  await navigateToAdminProducts(page);

  
  const productLink = page.getByRole('link', { name: zeroStockProduct.name });
  if (await productLink.count() > 0) {
    await productLink.click();
    await page.waitForTimeout(1000);

    
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
    await page.waitForTimeout(1000);
  }
}


async function clearCart(page) {
  await page.goto(`${baseUrl}/cart`);
  
  
  const emptyCartText = page.getByText('Your Cart Is Empty');
  if (await emptyCartText.isVisible()) {
    return; 
  }
  
  
  const removeButtons = await page.getByRole('button', { name: 'Remove' }).all();
  for (const button of removeButtons) {
    await button.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Checkout with Zero Stock Items Test', () => {
  test.beforeAll(async ({ browser }) => {
    
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await createZeroStockProduct(page);
    await logout(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await deleteZeroStockProduct(page);
    await page.close();
  });

  test('user cannot checkout with zero stock item', async ({ page }) => {
    
    await loginAsUser(page);
    await clearCart(page);
    
    
    await page.goto(baseUrl);
    await page.getByRole('searchbox', { name: 'Search' }).click();
    await page.getByRole('searchbox', { name: 'Search' }).fill(zeroStockProduct.name);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(1000);
    
    
    await page.getByRole('button', { name: 'More Details' }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
    await page.waitForTimeout(500);

    
    const thirdSuccessToast = page.getByText('Item Added to cart');
    await expect(thirdSuccessToast).toBeVisible();
    
    
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForTimeout(1000);
    
    
    await page.getByRole('button', { name: 'Paying with Card' }).click();
    await page.waitForTimeout(1000);
    
    
    
    await page.locator('iframe[name="braintree-hosted-field-number"]')
        .contentFrame()
        .getByRole('textbox', { name: 'Credit Card Number' })
        .fill('4111111111111111');
    
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]')
        .contentFrame()
        .getByRole('textbox', { name: 'Expiration Date' })
        .fill('1225');
    
    await page.locator('iframe[name="braintree-hosted-field-cvv"]')
        .contentFrame()
        .getByRole('textbox', { name: 'CVV' })
        .fill('123');
    
    
    await page.getByRole('button', { name: 'Make Payment' }).click();
    await page.waitForTimeout(1000);

    const itemOutofStockToast = page.getByText('Product is out of stock: ' + zeroStockProduct.name);
    await expect(itemOutofStockToast).toBeVisible();
  });
});