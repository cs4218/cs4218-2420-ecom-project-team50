import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const baseUrl = 'http://localhost:3000';

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

async function createOrder(page) {
  
  await clearCart(page);
  
  await page.goto(baseUrl);
  await page.waitForTimeout(1000);
  
  await page.locator('.card-name-price > button:nth-child(2)').first().click();
  await page.waitForTimeout(500);
  
  const successToast = page.getByText('Item Added to cart');
  await expect(successToast).toBeVisible();
  
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.waitForTimeout(1000);
  
  const emptyCartText = page.getByText('Your Cart Is Empty');
  await expect(emptyCartText).not.toBeVisible();
  
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
  
  await page.waitForURL(`${baseUrl}/dashboard/user/orders`);
  await page.waitForTimeout(1000);
  
  const orderElement = page.locator('.list-group-item').first();
  await expect(orderElement).toBeVisible();
}


async function adminChangeOrderStatus(page) {
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
  await page.waitForTimeout(1000);
  
  const orderRow = page.getByRole('row').filter({ has: page.getByText('test@gmail.com') }).first();
  
  const statusDropdown = orderRow.locator('span').nth(1);
  await statusDropdown.click();
  await page.waitForTimeout(500);
  
  await page.getByTitle('Processing').locator('div').click();
  await page.waitForTimeout(1000);
  
  await expect(page.getByText('Status Updated')).toBeVisible();
}

async function userViewOrderStatus(page) {
  await page.getByRole('button', { name: 'test@gmail.com' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
  await page.waitForTimeout(1000);
  
  const orderDivs = page.locator('.border.shadow');
  const orderCount = await orderDivs.count();
  
  if (orderCount === 0) {
    throw new Error('No orders found for user');
  }
  
  const lastOrderDiv = orderDivs.nth(orderCount - 1);
  
  const statusCell = lastOrderDiv.locator('tbody tr td').nth(1);
  const statusText = await statusCell.textContent();
  
  const hasEditableStatus = await lastOrderDiv.locator('select, button, .ant-select').count() > 0;
  
  return {
    status: statusText.trim(),
    canEditStatus: hasEditableStatus
  };
}

test.describe('Order Status Management Tests', () => {
  test('admin can change order status and user can view updated status', async ({ page, browser }) => {
    
    await loginAsUser(page);
    await createOrder(page);
    
    const initialOrderInfo = await userViewOrderStatus(page);
    const initialStatus = initialOrderInfo.status;
    
    await page.waitForTimeout(1000);
    
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await loginAsAdmin(adminPage);
    await adminChangeOrderStatus(adminPage);
    
    await adminPage.close();
    await adminContext.close();
    
    await page.reload();
    const updatedOrderInfo = await userViewOrderStatus(page);
    
    expect(updatedOrderInfo.status).toBe('Processing');
    
    expect(updatedOrderInfo.status).not.toBe(initialStatus);
    
    expect(updatedOrderInfo.canEditStatus).toBe(false);
  });

  test('admin can see and change multiple order statuses', async ({ page }) => {
    
    await loginAsAdmin(page);
    
    await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Orders' }).click();
    await page.waitForTimeout(1000);
    
    const orderRows = page.getByRole('row').filter({ has: page.getByRole('cell') });
    const orderCount = await orderRows.count();
    
    if (orderCount <= 1) { 
      test.skip('Not enough orders to test');
      return;
    }
    
    const firstOrderRow = orderRows.nth(1); 
    const statusCell = firstOrderRow.locator('span').nth(1);
    
    await statusCell.click();
    await page.waitForTimeout(500);
    
    const statusOptions = page.locator('.ant-select-item-option');
    const optionsCount = await statusOptions.count();
    
    expect(optionsCount).toBeGreaterThan(0);
    
    await page.getByTitle('Delivered').locator('div').click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Status Updated')).toBeVisible();
  });
});