import { test, expect } from "@playwright/test";

// Test data
const USER_CREDENTIALS = {
	email: process.env.USER_EMAIL || "test@example.com",
	password: process.env.USER_PASSWORD || "test123",
};

const TEST_PRODUCT = {
	name: "Novel",
	price: "14.99",
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
	// Wait for homepage to load after login
	await page.waitForURL("http://localhost:3000/");
}

test.describe("User Shopping Flows", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsUser(page);
	});

	test("should add products to cart and verify persistence", async ({
		page,
	}) => {
		// Add to cart
		await page.click(
			`.card-body:has-text("${TEST_PRODUCT.name}") button:has-text("ADD TO CART")`
		);

		// Verify success message
		await expect(page.getByText("Item Added to cart")).toBeVisible();

		// Navigate away
		await page.goto("http://localhost:3000/");
		await page.waitForURL("http://localhost:3000/");

		// Go to cart
		await page.click("text=Cart");
		await page.waitForURL("http://localhost:3000/cart");

		// Verify product is in cart
		await expect(
			page.getByText(TEST_PRODUCT.name, { exact: true })
		).toBeVisible();
		await expect(page.getByText(`Price : ${TEST_PRODUCT.price}`)).toBeVisible();
	});

	test("should add multiple products including similar products", async ({
		page,
	}) => {
		// Add main product to cart
		await page.click(
			`.card-body:has-text("${TEST_PRODUCT.name}") button:has-text("ADD TO CART")`
		);

		// Verify success message
		await expect(page.getByText("Item Added to cart").first()).toBeVisible();

		// Add to cart
		await page.click(
			`.card-body:has-text("NUS T-shirt") button:has-text("ADD TO CART")`
		);

		// Verify success message
		await expect(page.getByText("Item Added to cart").nth(1)).toBeVisible();

		// Go to cart
		await page.click("text=Cart");
		await page.waitForURL("http://localhost:3000/cart");

		// Verify both products are in cart
		expect(page.getByText("You Have 2 items in your cart")).toBeVisible();

		// Proceed to checkout
		await expect(page.locator('button:has-text("Make Payment")')).toBeEnabled();
	});

	test("should maintain cart state between sessions", async ({ page }) => {
		// Add main product to cart
		await page.click(
			`.card-body:has-text("${TEST_PRODUCT.name}") button:has-text("ADD TO CART")`
		);

		// Verify success message
		await expect(page.getByText("Item Added to cart").first()).toBeVisible();

		// Logout
		await page.click(
			'a.nav-link.dropdown-toggle:has-text("Test User")[role="button"]'
		);
		await page.click(".dropdown-menu >> text=Logout");

		// Login again
		await loginAsUser(page);

		// Go to cart
		await page.click("text=Cart");
		await page.waitForURL("http://localhost:3000/cart");

		// Verify product still in cart
		await expect(
			page.getByText(TEST_PRODUCT.name, { exact: true })
		).toBeVisible();
		await expect(page.getByText(`Price : ${TEST_PRODUCT.price}`)).toBeVisible();
	});
});
