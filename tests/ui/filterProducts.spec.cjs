import { test, expect } from '@playwright/test';

const url = 'http://localhost:3000/';


const priceRanges = new Map([
  ["$0 to", [0, 19.99]],
  ["$20 to", [20, 39.99]],
  ["$40 to", [40, 59.99]],
  ["$60 to", [60, 79.99]],
  ["$80 to", [80, 99.99]],
  ["$100 or more", [100, Number.MAX_SAFE_INTEGER]],
]);


test.beforeEach(async ({ page }) => {
  await page.goto(url);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);
});


async function ensureFiltersApplied(page, checkedCategories, priceRange = null, uncheckedCategories = []) {
  
  for (const category of checkedCategories) {
    if (!await page.getByRole('checkbox', { name: category }).isChecked()) {
      await page.getByRole('checkbox', { name: category }).check();
      await page.waitForTimeout(1000);
    }
  }

  
  for (const category of uncheckedCategories) {
    if (await page.getByRole('checkbox', { name: category }).isChecked()) {
      await page.getByRole('checkbox', { name: category }).uncheck();
      await page.waitForTimeout(1000);
    }
  }

  
  if (priceRange && !await page.getByRole('radio', { name: priceRange }).isChecked()) {
    await page.getByRole('radio', { name: priceRange }).check();
    await page.waitForTimeout(1000);
  }
}

test.describe('Category Filter Tests', () => {
  test('filter by single category and verify all products', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Book' }).check();
    await page.waitForTimeout(1000);
  
    const productCount = await page.$eval('[data-testid=product-list]', (el) => el.children.length);
    for (let i = 0; i < productCount; i++) {
      await page.getByRole('button', { name: 'More Details' }).nth(i).click();
      await expect(page.getByRole('heading', { name: 'Category : Book' })).toBeVisible();
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      
      await ensureFiltersApplied(page, ['Book']);
    }
  });
  
  test('filter by multiple categories and verify all products', async ({ page }) => {
    
    await page.getByRole('checkbox', { name: 'Book' }).check();
    await page.waitForTimeout(1000);
    await page.getByRole('checkbox', { name: 'Clothing' }).check();
    await page.waitForTimeout(1000);
  
    const productCount = await page.$eval('[data-testid=product-list]', (el) => el.children.length);
    for (let i = 0; i < productCount; i++) {
      await page.getByRole('button', { name: 'More Details' }).nth(i).click();
      
      
      await expect(page.getByRole('heading', { name: /Category : (Book|Clothing)/ })).toBeVisible();
      
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      
      await ensureFiltersApplied(page, ['Book', 'Clothing']);
    }
  });
});


for (const [range, [min, max]] of priceRanges) {
  test(`filter by price range ${range} and verify all products`, async ({ page }) => {
    await page.getByRole('radio', { name: range }).check();
    await page.waitForTimeout(1000);

    
    const products = page.locator('[data-testid=product-list] > *');
    const productCount = await products.count();
    console.log(`Product count: ${productCount}`);

    
    for (let i = 0; i < productCount; i++) {
      const currentProduct = products.nth(i);
      const priceHeading = currentProduct.getByRole('heading', { name: /\$\d+(,\d*)*\.\d{2}/ });
      await expect(priceHeading).toBeVisible();

      const priceText = await priceHeading.textContent();
      const price = parseFloat(priceText.replace('$', '').replace(/,/g, ''));

      
      expect(price).toBeGreaterThanOrEqual(min);
      expect(price).toBeLessThanOrEqual(max);
    }
  });
}

test('filter with product right at the edge of price range (19.99)', async ({ page }) => {
  
  const testProductName = `Edge Test Product`;
  
  
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.waitForTimeout(1000);
  
  
  console.log(`Creating test product with edge price: ${testProductName}`);
  
  
  await page.getByTestId('select-category').click();
  await page.getByTitle('Electronics').click(); 
  
  
  await page.getByRole('textbox', { name: 'write a name' }).fill(testProductName);
  
  
  await page.getByRole('textbox', { name: 'write a description' }).fill('This is a test product for testing price filter edge cases');
  
  
  await page.getByPlaceholder('write a Price').fill('19.99');
  
  
  await page.getByPlaceholder('write a quantity').fill('10');
  
  
  await page.getByTestId('select-shipping').click();
  await page.getByText('Yes').click();
  
  
  await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
  await page.waitForTimeout(2000); 
  
  
  await page.goto(url);
  await page.waitForTimeout(1000);
  
  
  await page.getByRole('radio', { name: '$0 to' }).check();
  await page.waitForTimeout(1000);
  
  
  const productInFirstRange = page.getByText(testProductName);
  await expect(productInFirstRange).toBeVisible();
  console.log('Product is visible in $0-$19.99 range as expected');
  
  
  await page.getByRole('radio', { name: '$20 to' }).check();
  await page.waitForTimeout(1000);
  
  
  await expect(page.getByText(testProductName)).not.toBeVisible();
  console.log('Product is not visible in $20-$39.99 range as expected');
  
  
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Products' }).click();
  await page.waitForTimeout(1000);
  
  
  const productLink = page.getByRole('link', { name: testProductName });
  await productLink.click();
  await page.waitForTimeout(1000);
  
  
  await page.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });
  
  await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
  await page.waitForTimeout(1000);
  
  console.log('Test product deleted successfully');
});

test.describe('Combined Filter Tests', () => {
  test('filter by multiple categories and price, then remove category filter', async ({ page }) => {
    
    await page.getByRole('checkbox', { name: 'Book' }).check();
    await page.waitForTimeout(1000);
    await page.getByRole('checkbox', { name: 'Clothing' }).check();
    await page.waitForTimeout(1000);
  
    
    const priceRange = "$0 to";
    const [minPrice, maxPrice] = priceRanges.get(priceRange);
    await page.getByRole('radio', { name: priceRange }).check();
    await page.waitForTimeout(1000);
  
    
    const products = page.locator('[data-testid=product-list] > *');
    const productCount = await products.count();
    
    
    for (let i = 0; i < productCount; i++) {
      const currentProduct = products.nth(i);
      const priceHeading = currentProduct.getByRole('heading', { name: /\$\d+(,\d*)*\.\d{2}/ });
      await expect(priceHeading).toBeVisible();
  
      const priceText = await priceHeading.textContent();
      const price = parseFloat(priceText.replace('$', '').replace(/,/g, ''));
  
      
      expect(price).toBeGreaterThanOrEqual(minPrice);
      expect(price).toBeLessThanOrEqual(maxPrice);
    }
  
    
    for (let i = 0; i < productCount; i++) {
      await page.getByRole('button', { name: 'More Details' }).nth(i).click();
  
      
      await expect(page.getByRole('heading', { name: /Category : (Book|Clothing)/ })).toBeVisible();
  
      await page.goBack();
      await page.waitForLoadState('networkidle');
  
      
      await ensureFiltersApplied(page, ['Book', 'Clothing'], priceRange);
    }
  
    
    await page.getByRole('checkbox', { name: 'Book' }).uncheck();
    await page.waitForTimeout(1000);
  
    
    const updatedProducts = page.locator('[data-testid=product-list] > *');
    const newProductCount = await updatedProducts.count();
    
    
    for (let i = 0; i < newProductCount; i++) {
      const currentProduct = updatedProducts.nth(i);
      const priceHeading = currentProduct.getByRole('heading', { name: /\$\d+(,\d*)*\.\d{2}/ });
      await expect(priceHeading).toBeVisible();
  
      const priceText = await priceHeading.textContent();
      const price = parseFloat(priceText.replace('$', '').replace(/,/g, ''));
  
      
      expect(price).toBeGreaterThanOrEqual(minPrice);
      expect(price).toBeLessThanOrEqual(maxPrice);
    }
  
    
    for (let i = 0; i < newProductCount; i++) {
      await page.getByRole('button', { name: 'More Details' }).nth(i).click();
  
      
      await expect(page.getByRole('heading', { name: 'Category : Clothing' })).toBeVisible();
  
      await page.goBack();
      await page.waitForLoadState('networkidle');
  
      
      await ensureFiltersApplied(page, ['Clothing'], priceRange, ['Book']);
    }
  });
  
  test('filter with no matching products shows appropriate message', async ({ page }) => {
    
    await page.getByRole('radio', { name: '$80 to' }).check();
    await page.waitForTimeout(1000);
    
    
    await expect(page.getByText('No Products Found')).toBeVisible();
  });
});