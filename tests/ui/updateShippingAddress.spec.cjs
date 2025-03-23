import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:3000';

function generateUniqueAddress() {
  return `Test Address`;
}

const newAddress = generateUniqueAddress();
let originalAddress = '';

async function loginAsUser(page) {
  await page.goto(`${baseUrl}/login`);
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@gmail.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
}

async function updateAddress(page, address) {
  await page.getByRole('button', { name: 'test@gmail.com' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Profile' }).click();
  await page.waitForTimeout(1000);
  
  const addressInput = page.getByRole('textbox', { name: 'Enter Your Address' });
  await addressInput.clear();
  await addressInput.fill(address);
  
  await page.getByRole('button', { name: 'UPDATE' }).click();
  await page.waitForTimeout(1000);
  
  await expect(page.getByText('Profile Updated Successfully')).toBeVisible();
}

async function clearCart(page) {
  await page.goto(`${baseUrl}/cart`);
  
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

async function addProductToCart(page) {
  await page.goto(baseUrl);
  await page.waitForTimeout(1000);
  
  await page.locator('.card-name-price > button:nth-child(2)').first().click();
  await page.waitForTimeout(500);
  
  const successToast = page.getByText('Item Added to cart');
  await expect(successToast).toBeVisible();
}

async function logout(page) {
  await page.getByRole('button', { name: 'test@gmail.com' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.waitForTimeout(1000);
  
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
}

test.describe('Update Shipping Address Tests', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsUser(page);
    
    await page.getByRole('button', { name: 'test@gmail.com' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForTimeout(1000);
    
    const addressInput = page.getByRole('textbox', { name: 'Enter Your Address' });
    originalAddress = await addressInput.inputValue();
    
    await page.close();
  });
  
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsUser(page);
    
    await updateAddress(page, originalAddress);
    
    await page.close();
  });

  test('user can update shipping address before checkout', async ({ page }) => {
   
    await loginAsUser(page);
    await clearCart(page);
    
   
    await addProductToCart(page);
    
   
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForTimeout(1000);
    
   
    await expect(page.getByText(/You Have \d+ items in your cart/)).toBeVisible();
    
   
    const updateAddressButton = page.getByRole('button', { name: 'Update Address' });
    await updateAddressButton.click();
    await page.waitForTimeout(1000);
    
   
    await expect(page.getByText('USER PROFILE')).toBeVisible();
    
   
    const addressInput = page.getByRole('textbox', { name: 'Enter Your Address' });
    await addressInput.clear();
    await addressInput.fill(newAddress);
    
   
    const nameInput = page.getByRole('textbox', { name: 'Enter Your Name' });
    const phoneInput = page.getByRole('textbox', { name: 'Enter Your Phone' });
    const originalName = await nameInput.inputValue();
    const originalPhone = await phoneInput.inputValue();
    
   
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await page.waitForTimeout(1000);
    
   
    const successToast = page.getByText('Profile Updated Successfully');
    await expect(successToast).toBeVisible();
    
   
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForTimeout(1000);
    
   
    const addressSection = page.locator('.cart-summary h5');
    await expect(addressSection).toBeVisible();
    await expect(addressSection).toHaveText(newAddress);
    
   
    await logout(page);
    
   
    await loginAsUser(page);
    
   
    await page.getByRole('button', { name: 'test@gmail.com' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForTimeout(1000);
    
   
    const profileAddressInput = page.getByRole('textbox', { name: 'Enter Your Address' });
    const currentAddress = await profileAddressInput.inputValue();
    expect(currentAddress).toBe(newAddress);
  });
});