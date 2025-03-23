import { test, expect } from '@playwright/test';


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


async function navigateToCreateProduct(page) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.waitForTimeout(1000);
}


async function clearCart(page) {
  await page.goto('http://localhost:3000/cart');
  
  
  const emptyCartText = page.getByText('Your Cart Is Empty');
  if (await emptyCartText.isVisible()) {
    return; 
  }
  
  
  const removeAllButton = page.getByRole('button', { name: 'Remove All' });
  if (await removeAllButton.isVisible()) {
    await removeAllButton.click();
    await page.waitForTimeout(1000);
    return;
  }
  
  
  const removeButtons = await page.getByRole('button', { name: 'Remove' }).all();
  for (const button of removeButtons) {
    await button.click();
    await page.waitForTimeout(500);
  }
}


async function getCartCount(page) {
  const cartBadge = page.locator('.ant-badge-count');
  const cartCountText = await cartBadge.textContent();
  
  
  const count = parseInt(cartCountText, 10);
  return isNaN(count) ? 0 : count;
}


async function verifyCartCountInHeader(page, expectedCount) {
  const cartCount = await getCartCount(page);
  expect(cartCount).toBe(expectedCount);
}


async function getCartItemCountFromPage(page) {
  await page.goto('http://localhost:3000/cart');
  await page.waitForTimeout(1000);
  
  
  const emptyCartText = page.getByText('Your Cart Is Empty');
  if (await emptyCartText.isVisible()) {
    return 0;
  }
  
  
  const cartItems = await page.locator('.row.card.flex-row').count();
  return cartItems;
}

test.describe('Cart Item Quantity Updates Tests', () => {
  
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await clearCart(page);
  });

  test('1. adding product increases cart count in header', async ({ page }) => {
    
    const initialCartCount = await getCartCount(page);
    
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    
    
    const firstAddToCartButton = page.locator('.card-name-price > button:nth-child(2)').first();
    await firstAddToCartButton.click();
    await page.waitForTimeout(500);
    
    
    await verifyCartCountInHeader(page, initialCartCount + 1);
  });

  test('2. adding product increases item count on cart page', async ({ page }) => {
    
    const initialItemCount = await getCartItemCountFromPage(page);
    
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    
    
    const firstAddToCartButton = page.locator('.card-name-price > button:nth-child(2)').first();
    await firstAddToCartButton.click();
    await page.waitForTimeout(500);
    
    
    const updatedItemCount = await getCartItemCountFromPage(page);
    
    
    expect(updatedItemCount).toBe(initialItemCount + 1);
    
    
    const cartMessage = page.getByText(`You Have ${updatedItemCount} items in your cart`, { exact: true });
    await expect(cartMessage).toBeVisible();
  });

  test('3. removing product decreases cart count in header', async ({ page }) => {
    
    await page.goto('http://localhost:3000/');
    const firstAddToCartButton = page.locator('.card-name-price > button:nth-child(2)').first();
    await firstAddToCartButton.click();
    await page.waitForTimeout(500);
    
    
    const cartCountAfterAdding = await getCartCount(page);
    
    
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForTimeout(1000);
    
    
    await page.getByRole('button', { name: 'Remove' }).click();
    await page.waitForTimeout(500);
    
    
    await verifyCartCountInHeader(page, cartCountAfterAdding - 1);
  });

  test('4. removing product decreases item count on cart page', async ({ page }) => {
    
    await page.goto('http://localhost:3000/');
    
    
    const firstAddToCartButton = page.locator('.card-name-price > button:nth-child(2)').first();
    await firstAddToCartButton.click();
    await page.waitForTimeout(500);
    
    
    const secondAddToCartButton = page.locator('.card-name-price > button:nth-child(2)').nth(1);
    await secondAddToCartButton.click();
    await page.waitForTimeout(500);
    
    
    let itemCount = await getCartItemCountFromPage(page);
    expect(itemCount).toBe(2);
    
    
    await page.getByRole('button', { name: 'Remove' }).first().click();
    await page.waitForTimeout(500);
    
    
    itemCount = await getCartItemCountFromPage(page);
    expect(itemCount).toBe(1);
    
    
    const cartMessage = page.getByText(`You Have ${itemCount} items in your cart`, { exact: true });
    await expect(cartMessage).toContainText(`You Have 1 items`);
  });

  test('5. removing last product makes cart empty', async ({ page }) => {
    
    await page.goto('http://localhost:3000/');
    const firstAddToCartButton = page.locator('.card-name-price > button:nth-child(2)').first();
    await firstAddToCartButton.click();
    await page.waitForTimeout(500);
    
    
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForTimeout(1000);
    
    
    await page.getByRole('button', { name: 'Remove' }).click();
    await page.waitForTimeout(500);
    
    
    const emptyCartText = page.getByText('Your Cart Is Empty');
    await expect(emptyCartText).toBeVisible();
    
    
    await verifyCartCountInHeader(page, 0);
  });
});