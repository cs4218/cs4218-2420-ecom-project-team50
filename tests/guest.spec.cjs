import { test, expect } from '@playwright/test';

test('Guest checkout flow with login prompt', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  
  expect(page.url()).toBe('http://localhost:3000/');
  
  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
  
    await page.getByRole('link', { name: 'Cart' }).click();
  
  expect(page.url()).toBe('http://localhost:3000/cart');
  
  await page.getByRole('button', { name: 'Please Login to checkout' }).click();
  
  expect(page.url()).toBe('http://localhost:3000/login');
  
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('lily@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('lily');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await page.waitForURL('http://localhost:3000/cart');
  
  await page.getByRole('button', { name: 'Paying with Card' }).click();
  
  try {
    await page.waitForSelector('iframe[name="braintree-hosted-field-number"]', { timeout: 10000 });
  } catch (error) {
    console.log('Payment iframe not found, current page HTML:');
    console.log(await page.content());
    throw error;
  }
  
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
  
  await page.waitForURL('http://localhost:3000/dashboard/user/orders');
  expect(page.url()).toBe('http://localhost:3000/dashboard/user/orders');
});