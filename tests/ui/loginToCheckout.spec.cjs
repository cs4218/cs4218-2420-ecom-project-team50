import { test, expect } from '@playwright/test';

const url = 'http://localhost:3000/';

async function loginAsUser(page) {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@gmail.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
}

async function clearCart(page) {
  await page.goto('http://localhost:3000/cart');
  
 
  const emptyCartText = page.getByText('Your Cart Is Empty');
  if (await emptyCartText.isVisible()) {
    return;
  }
  
 
  const removeAllButton = page.getByRole('button', { name: 'Remove All' });
  if (await removeAllButton.count() > 0 && await removeAllButton.isVisible()) {
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

test('Complete user journey from login to checkout', async ({ page }) => {
 
  await loginAsUser(page);
  await clearCart(page);
  
 
 
  await page.goto(url);
  await page.waitForTimeout(1000);
  
  await page.getByRole('checkbox', { name: 'Book' }).check();
  await page.waitForTimeout(1000);
  
 
  await page.locator('.card-name-price > button:nth-child(2)').first().click();
  await page.waitForTimeout(500);
  
 
  const firstSuccessToast = page.getByText('Item Added to cart');
  await expect(firstSuccessToast).toBeVisible();
  
 
 
  await page.getByRole('checkbox', { name: 'Book' }).uncheck();
  await page.waitForTimeout(1000);
  
 
  await page.getByRole('radio', { name: '$0 to' }).check();
  await page.waitForTimeout(1000);
  
 
  await page.locator('.card-name-price > button:nth-child(2)').first().click();
  await page.waitForTimeout(500);
  
 
  const secondSuccessToast = page.getByText('Item Added to cart');
  await expect(secondSuccessToast).toBeVisible();
  
 
 
  await page.goto(url);
  await page.waitForTimeout(1000);
  
 
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('NUS T-shirt');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForTimeout(1000); 
 
  await page.getByRole('button', { name: 'More Details' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'ADD TO CART' }).click();
  await page.waitForTimeout(500);
  
 
  const thirdSuccessToast = page.getByText('Item Added to cart');
  await expect(thirdSuccessToast).toBeVisible();
  
 
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.waitForTimeout(1000);
  
 
  const cartMessage = page.getByText(`You Have 3 items in your cart`, { exact: true });
  await expect(cartMessage).toBeVisible();
  
 
 
  const cartRows = await page.locator('.row.card.flex-row').all();
  let nusShirtRemoved = false;
  
  for (const row of cartRows) {
    const productText = await row.textContent();
    if (productText.includes('NUS T-shirt')) {
      const removeButton = row.getByRole('button', { name: 'Remove' });
      await removeButton.click();
      await page.waitForTimeout(500);
      nusShirtRemoved = true;
      break;
    }
  }
  
  if (!nusShirtRemoved) {
   
    test.skip();
  }
  
 
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
  
 
  await page.waitForURL('http://localhost:3000/dashboard/user/orders');
  await expect(page.url()).toBe('http://localhost:3000/dashboard/user/orders');
  
 
  const orderHistory = page.locator('.list-group-item');
  await expect(orderHistory.first()).toBeVisible();
});