import { test, expect } from '@playwright/test';

test('Guest checkout flow with login prompt', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  
  expect(page.url()).toBe('http://localhost:3000/');
  
  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
  
  await page.getByRole('link', { name: 'Cart' }).click();
  
  expect(page.url()).toBe('http://localhost:3000/cart');
  
  await page.getByRole('button', { name: 'Please Login to checkout' }).click();
  
  expect(page.url()).toBe('http://localhost:3000/login');
  
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await page.waitForURL('http://localhost:3000/cart');
  
  await page.getByRole('button', { name: 'Paying with Card' }).click();
  
});