import { test, expect } from '@playwright/test';

test('Checkout and process payment flow', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  
  await page.getByRole('link', { name: 'Login' }).click();
  
  expect(page.url()).toBe('http://localhost:3000/login');
  
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await page.waitForURL('http://localhost:3000/');
  
  await page.locator('div:nth-child(5) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
    
  await page.getByRole('link', { name: 'Cart' }).click();
  
  expect(page.url()).toBe('http://localhost:3000/cart');
    
  await page.getByRole('button', { name: 'Paying with Card' }).click();
  
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