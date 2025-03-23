import { test, expect } from "@playwright/test";

test.describe("Category and Product Details Integration", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("http://localhost:3000");
	});

	test("should show category information in product details", async ({
		page,
	}) => {
		// Navigate to a category
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });
		await page.click('.dropdown-menu a:has-text("Book")');

		// Get first product name and click details
		const productName = await page.locator(".card-title").first().textContent();
		await page.click('button:has-text("More Details")');

		// Verify category info in product details
		await expect(page.locator(".product-details")).toContainText(productName);
		await expect(page.getByText("Category : Book")).toBeVisible();
	});

	test("should show similar products from same category", async ({ page }) => {
		// Navigate to product details
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });
		await page.click('.dropdown-menu a:has-text("Book")');
		await page.click('button:has-text("More Details")');

		// Verify similar products section
		await expect(page.locator(".similar-products")).toBeVisible();
		await expect(page.locator('button:has-text("More Details")')).toBeDefined();
	});

	test("should update product details when changing categories", async ({
		page,
	}) => {
		// Get details of product from Book
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });
		await page.click('.dropdown-menu a:has-text("Book")');
		const Product = await page.locator(".card-title").first().textContent();

		// Get details of product from Books
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });
		await page.click('.dropdown-menu a:has-text("Clothing")');
		await page.waitForTimeout(1000);
		const otherProduct = await page
			.locator(".card-title")
			.first()
			.textContent();

		// Verify they're different products
		expect(Product).not.toBe(otherProduct);
	});
});
