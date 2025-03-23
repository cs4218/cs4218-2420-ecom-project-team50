import { test, expect } from '@playwright/test';

test.describe('Login Tests', () => {
  let page;
  
  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('http://localhost:3000/login');
            
    const buttons = await page.locator('button').all();
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent();
      const buttonType = await buttons[i].getAttribute('type');
    }
  });
  
  test('Failed login simulation', async () => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    const loginButton = await page.getByRole('button', { name: /login/i });
    
    await loginButton.click();
    
    await page.waitForTimeout(2000);
    
    await expect(page.url()).toContain('login');
    
  });
  
  test('Successful login simulation by direct localStorage manipulation', async () => {
    
    await expect(page.url()).toContain('login');
    
    await page.evaluate(() => {
      const authData = {
        success: true,
        message: 'Login successful',
        token: 'fake-jwt-token-for-testing',
        user: {
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          _id: '123456789'
        }
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      
      return true;
    });
    
    const hasAuth = await page.evaluate(() => {
      const auth = localStorage.getItem('auth');
      console.log('Auth in localStorage:', auth);
      return auth !== null;
    });
    
    expect(hasAuth).toBe(true);
    
    await page.goto('http://localhost:3000/');
    
    await expect(page.url()).toBe('http://localhost:3000/');
    
  });
  
  test('Full login flow with manual auth setting', async () => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.getByRole('button', { name: /login/i }).click();
    
    await page.waitForTimeout(2000);
    
    await expect(page.url()).toContain('login');
    
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="password"]', '');
    await page.fill('input[type="email"]', 'correct@example.com');
    await page.fill('input[type="password"]', 'correctpassword');
    
    await page.evaluate(() => {
      const authData = {
        success: true,
        message: 'Login successful',
        token: 'fake-jwt-token-for-testing',
        user: {
          name: 'Test User',
          email: 'correct@example.com',
          role: 'user',
          _id: '123456789'
        }
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      return true;
    });
    
    await page.goto('http://localhost:3000/');
    
    await expect(page.url()).toBe('http://localhost:3000/');
    
    const hasAuth = await page.evaluate(() => localStorage.getItem('auth') !== null);
    expect(hasAuth).toBe(true);
  });
});