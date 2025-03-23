import { test, expect } from "@playwright/test";

const USER_CREDENTIALS = {
	email: "test@test.com",
	password: "test123",
};

async function loginAsUser(page) {
	await page.goto("http://localhost:3000/login");
	await page.waitForSelector("form", { state: "visible" });
	await page.fill('input[type="email"]', USER_CREDENTIALS.email);
	await page.fill('input[type="password"]', USER_CREDENTIALS.password);
	await Promise.all([
		page.waitForResponse((response) =>
			response.url().includes("/api/v1/auth/login")
		),
		page.click('button:has-text("LOGIN")'),
	]);
	await page.waitForSelector('div[role="status"]', {
		state: "visible",
		timeout: 5000,
	});
}

test.describe("Category Hook and Page Integration", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("http://localhost:3000");
	});

	test("should load and display categories in navbar", async ({ page }) => {
		// Categories should be loaded by useCategory hook and displayed in navbar
		await page.waitForSelector(
			'a.nav-link.dropdown-toggle:has-text("Categories")'
		);
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });

		// Verify some default categories exist
		const dropdownContent = await page.locator(".dropdown-menu").textContent();
		expect(dropdownContent).toContain("Clothing");
		expect(dropdownContent).toContain("Book");
	});

	test("should navigate to category page and display products", async ({
		page,
	}) => {
		// Click on Categories dropdown
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });

		// Click on Clothing category
		await page.click('.dropdown-menu a:has-text("Clothing")');

		// Verify category title is displayed
		await expect(page.getByText("Category - Clothing")).toBeVisible();

		await expect(page.locator('button:has-text("More Details")')).toBeVisible();
	});

	test("should handle empty categories gracefully", async ({ page }) => {
		// Navigate to a category known to be empty
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });
		await page.click('.dropdown-menu a:has-text("Empty Category")');

		// Verify empty state message
		await expect(page.getByText("0 result found")).toBeVisible();
	});

	test("should add product to cart from category page", async ({ page }) => {
		// Login first
		await loginAsUser(page);

		// Navigate to Clothing category
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });
		await page.click('.dropdown-menu a:has-text("Clothing")');

		// Click add to cart on first product
		await page.click('button:has-text("More Details")');
		await page.waitForTimeout(1000);
		await page.click('button:has-text("ADD TO CART")');
		// Wait for success message
		await expect(page.getByText("Item Added to cart")).toBeVisible();
	});

	test("should persist category selection after page refresh", async ({
		page,
	}) => {
		// Navigate to Clothing category
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });
		await page.click('.dropdown-menu a:has-text("Clothing")');

		// Get current URL
		const currentUrl = page.url();

		// Refresh page
		await page.reload();

		// Verify we're still on the same category page
		expect(page.url()).toBe(currentUrl);
		await expect(page.getByText("Category - Clothing")).toBeVisible();
	});
});
