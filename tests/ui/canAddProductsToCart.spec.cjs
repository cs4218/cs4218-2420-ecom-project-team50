import { test, expect } from '@playwright/test';


async function loginAsUser(page) {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@gmail.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
}


async function verifyCartHasItem(page, expectedProductName) {
  
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.waitForTimeout(1000);
  
  
  const cartHeading = page.locator('.cart-page p.text-center');
  await expect(cartHeading).not.toContainText('Your Cart Is Empty');
  await expect(cartHeading).toContainText('You Have');
  
  
  const productNameInCart = page.locator('.row.card.flex-row p').first();
  await expect(productNameInCart).toContainText(expectedProductName.trim());
}


async function clearCart(page) {
  await page.goto('http://localhost:3000/cart');
  
  
  const emptyCartText = page.getByText('Your Cart Is Empty');
  if (await emptyCartText.isVisible()) {
    return; 
  }
  
  
  const removeButtons = page.getByRole('button', { name: 'Remove' }).all();
  const buttons = await removeButtons;
  for (const button of buttons) {
    await button.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Add Products to Cart Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await clearCart(page);
  });

  test('add product to cart from home page', async ({ page }) => {
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    
    
    const productName = await page.locator('.card .card-title').first().textContent();
    await page.locator('.card-name-price > button:nth-child(2)').first().click();
    await page.waitForTimeout(500);
    
    
    const successToast = page.getByText('Item Added to cart');
    await expect(successToast).toBeVisible();
    
    
    await verifyCartHasItem(page, productName);
  });

  test('add product to cart from product details page', async ({ page }) => {
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    
    
    const productName = await page.locator('.card .card-title').first().textContent();
    await page.getByTestId(productName).click();
    await page.waitForTimeout(1000);
    
    
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
    await page.waitForTimeout(500);
    
    
    const successToast = page.getByText('Item Added to cart');
    await expect(successToast).toBeVisible();
    
    
    await verifyCartHasItem(page, productName);
  });

  test('add product to cart from category page', async ({ page }) => {
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    
    
    await page.getByRole('link', { name: 'Categories' }).click();
    const categoryName = 'All Categories';
    await page.getByRole('link', { name: 'All Categories' }).click();
    await page.getByRole('link', { name: 'Electronics' }).click();
    await page.waitForTimeout(1000);
    
    
    const productCards = page.locator('.card');
    const productCount = await productCards.count();
    
    if (productCount > 0) {
      
      const productName = await page.locator('.card .card-title').first().textContent();
      await page.locator('.card .btn-info').first().click();
      await page.waitForTimeout(1000);
      
      
      await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
      await page.waitForTimeout(500);
      
      
      const successToast = page.getByText('Item Added to cart');
      await expect(successToast).toBeVisible();
      
      
      await verifyCartHasItem(page, productName);
    } else {
      console.log(`No products available in category: ${categoryName}`);
      test.skip();
    }
  });
});