import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test('Product search, view details, and add to cart flow (no login)', async ({ page }) => {
  const searchTerm = 'laptop'; 
  
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);
  
  const possibleSearchSelectors = [
    'input[name="search"]',
    'input[placeholder*="search" i]',
    'input[aria-label*="search" i]',
    'input.search-input',
    '.search-bar input',
    'form[role="search"] input'
  ];
  
  let searchInput = null;
  for (const selector of possibleSearchSelectors) {
    const element = await page.$(selector);
    if (element) {
      searchInput = element;
      break;
    }
  }
  
  if (!searchInput) {
    throw new Error('Search input not found');
  }
  
  await searchInput.fill(searchTerm);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
    
  const productCardSelectors = [
    '.card',
    '.product-card',
    '[data-testid="product-item"]',
    '.product-list > div'
  ];
  
  let productCards = null;
  for (const selector of productCardSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      productCards = page.locator(selector);
      break;
    }
  }
  
  if (!productCards || await productCards.count() === 0) {
    throw new Error('No product cards found in search results');
  }
  
  const firstProductElement = productCards.first();
  const productNameSelector = '.card-title, h5, h4, .product-name';
  const productNameElement = firstProductElement.locator(productNameSelector);
  
  let firstProductName = 'Unknown Product';
  if (await productNameElement.count() > 0) {
    firstProductName = await productNameElement.textContent() || 'Unknown Product';
  }
  
  const detailsButtonSelector = 'button:has-text("More Details"), a:has-text("More Details"), a:has-text("View Details")';
  await firstProductElement.locator(detailsButtonSelector).click();
  
  await page.waitForTimeout(3000);
  
  const addToCartSelectors = [
    'button:has-text("ADD TO CART")',
    'button:has-text("Add to Cart")',
    'button:has-text("Add to cart")',
    'button:has-text("Add To Cart")',
    'button.add-to-cart'
  ];
  
  let addToCartButton = null;
  for (const selector of addToCartSelectors) {
    const button = await page.$(selector);
    if (button) {
      addToCartButton = button;
      break;
    }
  }
  
  if (!addToCartButton) {
    throw new Error('Add to Cart button not found');
  }
  
  await addToCartButton.click();
  await page.waitForTimeout(2000);
    
  await page.goto('http://localhost:3000/cart');
  await page.waitForTimeout(3000);
  
  const cartItemSelectors = [
    '.cart-page .card',
    '.cart-items .item',
    '.cart-container .product'
  ];
  
  let cartItems = null;
  for (const selector of cartItemSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      cartItems = page.locator(selector);
      break;
    }
  }
});

test('should display "No Products Found" when searching for a non-existent product', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  
  await expect(page).toHaveTitle(/Ecommerce App|ALL Products - Best offers/);
  
  let searchInput;
  try {
    searchInput = await page.getByPlaceholder('Search');
    if (!await searchInput.isVisible()) {
      searchInput = await page.getByRole('textbox', { name: 'Search' });
    }
  } catch (e) {
    searchInput = await page.locator('input[type="search"], input[type="text"][name*="search" i], input[type="text"][placeholder*="search" i]').first();
  }
  await searchInput.fill('tempfakeproduct');
  
  await searchInput.press('Enter');
  
  await expect(page).toHaveURL('http://localhost:3000/search');
  
  await expect(page.getByText('No Products Found')).toBeVisible();
  
  await expect(page.getByText('No search results to display')).toBeVisible();
});
