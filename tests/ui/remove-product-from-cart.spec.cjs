import { test, expect } from '@playwright/test';

test('Test cart functionality - adding and removing products', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('lily@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('lily23');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await expect(page).toHaveURL('http://localhost:3000/');
  
  const firstProductName = await page.locator('.card').first().locator('.card-title').first().textContent();
  
  await page.locator('.card').first().getByText('ADD TO CART').click();
  
  await expect(page.getByText('Item Added to cart')).toBeVisible();
  
  const secondProductName = await page.locator('.card').nth(1).locator('.card-title').first().textContent();
  const secondProductPrice = await page.locator('.card').nth(1).locator('.card-price').textContent();
  
  await page.locator('.card').nth(1).getByText('ADD TO CART').click();
  
  await page.getByRole('link', { name: 'Cart' }).click();
  
  await expect(page).toHaveURL('http://localhost:3000/cart');
  
  await expect(page.getByText(firstProductName)).toBeVisible();
  await expect(page.getByText(secondProductName)).toBeVisible();
  
  const totalPriceBefore = await page.locator('.cart-summary h4:has-text("Total :")').textContent();
  
  const removeButtons = await page.getByRole('button', { name: 'Remove' }).all();
  await removeButtons[1].click();
  
  await expect(page.getByText(secondProductName)).not.toBeVisible();
  
  const totalPriceAfter = await page.locator('.cart-summary h4:has-text("Total :")').textContent();
  
  expect(totalPriceBefore).not.toEqual(totalPriceAfter);
  
  const remainingProducts = await page.locator('.row.card.flex-row').all();
  expect(remainingProducts.length).toBe(1);
  
  await expect(page.getByText(firstProductName)).toBeVisible();
});

test('Test empty cart functionality', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('lily@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('lily23');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await page.waitForURL('http://localhost:3000/');
  
  await page.locator('.card').first().getByText('ADD TO CART').click();
  
  await expect(page.getByText('Item Added to cart')).toBeVisible();
  
  await page.goto('http://localhost:3000/cart');
  
  let removeButtons = await page.getByRole('button', { name: 'Remove' }).all();
  
  while (removeButtons.length > 0) {
    await page.getByRole('button', { name: 'Remove' }).first().click();
    await page.waitForTimeout(500);
    removeButtons = await page.getByRole('button', { name: 'Remove' }).all();
  }
  
  const remainingRemoveButtons = await page.getByRole('button', { name: 'Remove' }).all();
  expect(remainingRemoveButtons.length).toBe(0);
  
  const headerText = await page.locator('.text-center p').textContent();
  expect(headerText).toContain('Your Cart Is Empty');
  
  const totalPrice = await page.locator('.cart-summary h4:has-text("Total :")').textContent();
  expect(totalPrice).toContain('$0');
});