import { test, expect } from '@playwright/test';

test('Register, update profile, logout, and re-login flow', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Register' }).click();
  
  const testUser = {
    name: 'John Smith',
    email: `john${Date.now()}@example.com`, 
    password: 'Password123',
    phone: '9876543210',
    address: '123 Main Street, Cityville',
    favoriteActivity: 'Reading'
  };
  
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill(testUser.name);
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(testUser.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(testUser.password);
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill(testUser.phone);
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill(testUser.address);
  
  const hasDOBField = await page.getByPlaceholder('Enter Your DOB').isVisible();
  if (hasDOBField) {
    await page.getByPlaceholder('Enter Your DOB').fill('1990-01-01');
  }
  
  const hasFavoriteSportsField = await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).isVisible();
  if (hasFavoriteSportsField) {
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill(testUser.favoriteActivity);
  }
  
  await page.getByRole('button', { name: 'REGISTER' }).click();
  
  await expect(page).toHaveURL(/\/login/);
  
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(testUser.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(testUser.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await expect(page).toHaveURL('http://localhost:3000/');
  
  const hasUserDropdown = await page.getByRole('button', { name: testUser.name }).isVisible();
  if (hasUserDropdown) {
    await page.getByRole('button', { name: testUser.name }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
  } else {
    await page.goto('http://localhost:3000/dashboard/user');
  }
  
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page).toHaveURL('http://localhost:3000/dashboard/user/profile');
  
  const updatedUser = {
    name: 'John Smith Updated',
    phone: '5555555555',
    address: '456 New Avenue, Townsville'
  };
  
  await page.getByRole('textbox', { name: 'Enter Your Name' }).clear();
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill(updatedUser.name);
  
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).clear();
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill(updatedUser.phone);
  
  await page.getByRole('textbox', { name: 'Enter Your Address' }).clear();
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill(updatedUser.address);
  
  await page.getByRole('button', { name: 'UPDATE' }).click();
  
  
  if (hasUserDropdown) {
    await page.getByRole('button', { name: updatedUser.name }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
  } else {
    await page.goto('http://localhost:3000/logout');
  }
  
  await expect(page).toHaveURL(/\/login/);
  
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(testUser.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(testUser.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await expect(page).toHaveURL('http://localhost:3000/');
  
  if (hasUserDropdown) {
    await expect(page.getByRole('button', { name: updatedUser.name })).toBeVisible();
  }
  
  if (hasUserDropdown) {
    await page.getByRole('button', { name: updatedUser.name }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
  } else {
    await page.goto('http://localhost:3000/dashboard/user');
  }
  
  await page.getByRole('link', { name: 'Profile' }).click();
  
  await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue(updatedUser.name);
  await expect(page.getByRole('textbox', { name: 'Enter Your Phone' })).toHaveValue(updatedUser.phone);
  await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toHaveValue(updatedUser.address);
});