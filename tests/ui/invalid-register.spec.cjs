const { test, expect } = require('@playwright/test');

test.describe('Registration Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    
    await expect(page.locator('.title')).toHaveText('REGISTER FORM');
  });

  test('should validate email format client-side', async ({ page }) => {
    await page.fill('#exampleInputName1', 'Test User');
    await page.fill('#exampleInputEmail1', 'invalid-email');
    await page.fill('#exampleInputPassword1', 'Password123');
    await page.fill('#exampleInputPhone1', '1234567890');
    await page.fill('#exampleInputaddress1', '123 Test St');
    await page.fill('#exampleInputDOB1', '1990-01-01');
    await page.fill('#exampleInputanswer1', 'Soccer');
    
    await page.locator('button:has-text("REGISTER")').click();
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveURL(/register/);
    
    await expect(page.locator('.form-container form')).toBeVisible();
    
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
  });

  test('should validate phone number format client-side', async ({ page }) => {
    await page.fill('#exampleInputName1', 'Test User');
    await page.fill('#exampleInputEmail1', 'valid@example.com');
    await page.fill('#exampleInputPassword1', 'Password123');
    await page.fill('#exampleInputPhone1', 'abc123'); 
    await page.fill('#exampleInputaddress1', '123 Test St');
    await page.fill('#exampleInputDOB1', '1990-01-01');
    await page.fill('#exampleInputanswer1', 'Soccer');
    
    await page.locator('button:has-text("REGISTER")').click();
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveURL(/register/);
    
    await expect(page.locator('.form-container form')).toBeVisible();
  });

  test('should validate both email and phone simultaneously', async ({ page }) => {
    await page.fill('#exampleInputName1', 'Test User');
    await page.fill('#exampleInputEmail1', 'invalid-email');
    await page.fill('#exampleInputPassword1', 'Password123');
    await page.fill('#exampleInputPhone1', 'abc123');
    await page.fill('#exampleInputaddress1', '123 Test St');
    await page.fill('#exampleInputDOB1', '1990-01-01');
    await page.fill('#exampleInputanswer1', 'Soccer');
    
    await page.locator('button:has-text("REGISTER")').click();
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveURL(/register/);
    
    await expect(page.locator('.form-container form')).toBeVisible();
  });

  test('should validate phone number length client-side', async ({ page }) => {
    await page.fill('#exampleInputName1', 'Test User');
    await page.fill('#exampleInputEmail1', 'valid@example.com');
    await page.fill('#exampleInputPassword1', 'Password123');
    await page.fill('#exampleInputPhone1', '123456789012345678'); // 18 digits (exceeds 15)
    await page.fill('#exampleInputaddress1', '123 Test St');
    await page.fill('#exampleInputDOB1', '1990-01-01');
    await page.fill('#exampleInputanswer1', 'Soccer');
    
    await page.locator('button:has-text("REGISTER")').click();
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveURL(/register/);
    
    await expect(page.locator('.form-container form')).toBeVisible();
  });    
  //   // Listen for response
  //   const responsePromise = page.waitForResponse('**/api/v1/auth/register');
    
  //   // Fill in the form with apparently valid data (that might still be rejected server-side)
  //   await page.fill('#exampleInputName1', 'Test User');
  //   await page.fill('#exampleInputEmail1', 'existing@example.com'); // Email might already exist
  //   await page.fill('#exampleInputPassword1', 'Password123');
  //   await page.fill('#exampleInputPhone1', '1234567890');
  //   await page.fill('#exampleInputaddress1', '123 Test St');
  //   await page.fill('#exampleInputDOB1', '1990-01-01');
  //   await page.fill('#exampleInputanswer1', 'Soccer');
    
  //   // Submit the form
  //   await page.locator('button:has-text("REGISTER")').click();
    
  //   try {
  //     // Wait for API response
  //     const response = await responsePromise;
  //     const responseBody = await response.json().catch(() => null);
      
  //     console.log('API Response:', responseBody);
      
  //     // Wait for any redirects or toast messages
  //     await page.waitForTimeout(2000);
      
  //     // Check if we got redirected to login (success case)
  //     const currentUrl = page.url();
  //     if (currentUrl.includes('login')) {
  //       console.log('Registration successful, redirected to login');
  //     } else {
  //       // We're still on the register page, might indicate an error
  //       await expect(page.locator('.form-container form')).toBeVisible();
        
  //       // Try to locate toast messages (based on react-hot-toast)
  //       const toastVisible = await page.locator('.Toastify__toast-body, [role="status"]').isVisible();
  //       if (toastVisible) {
  //         console.log('Toast notification is visible');
  //       }
  //     }
  //   } catch (error) {
  //     console.log('Error during API test:', error.message);
  //     // We might not get a response if client validation prevented the API call
  //     await expect(page.locator('.form-container form')).toBeVisible();
  //   }
  // });

  test('should not submit when required fields are missing', async ({ page }) => {
    await page.fill('#exampleInputName1', 'Test User');
    await page.fill('#exampleInputEmail1', 'valid@example.com');
    
    await page.locator('button:has-text("REGISTER")').click();
    
    await expect(page).toHaveURL(/register/);
    
    await expect(page.locator('.form-container form')).toBeVisible();
  });
});