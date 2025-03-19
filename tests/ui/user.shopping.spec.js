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
			`.card-body:has-text("The Law of Contract in Singapore") button:has-text("ADD TO CART")`
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

	test("should update cart total when adding products", async ({ page }) => {
		// Get initial cart total
		await page.click("text=Cart");
		await page.waitForURL("http://localhost:3000/cart");

		const initialTotal = await page
			.locator('.cart-summary h4:has-text("Total")')
			.textContent();

		// Add product
		await page.goto("http://localhost:3000/");
		await page.waitForSelector(`text=${TEST_PRODUCT.name}`, {
			state: "visible",
		});
		await page.click(`text=${TEST_PRODUCT.name}`);
		await page.waitForSelector('button:has-text("ADD TO CART")', {
			state: "visible",
		});
		await page.click('button:has-text("ADD TO CART")');
		await page.waitForSelector(".toast-success", {
			state: "visible",
			timeout: 5000,
		});

		// Go back to cart
		await page.click("text=Cart");
		await page.waitForURL("http://localhost:3000/cart");

		// Verify total is updated
		const updatedTotal = await page
			.locator('.cart-summary h4:has-text("Total")')
			.textContent();
		expect(updatedTotal).not.toBe(initialTotal);
	});

	test("should handle adding same product multiple times", async ({ page }) => {
		// Add same product twice
		await page.click(`text=${TEST_PRODUCT.name}`);
		await page.waitForSelector('button:has-text("ADD TO CART")', {
			state: "visible",
		});
		await page.click('button:has-text("ADD TO CART")');
		await page.waitForSelector(".toast-success", {
			state: "visible",
			timeout: 5000,
		});
		await page.click('button:has-text("ADD TO CART")');
		await page.waitForSelector(".toast-success", {
			state: "visible",
			timeout: 5000,
		});

		// Go to cart
		await page.click("text=Cart");
		await page.waitForURL("http://localhost:3000/cart");

		// Verify product quantity
		const productEntries = await page
			.locator(`text=${TEST_PRODUCT.name}`)
			.count();
		expect(productEntries).toBe(2);

		// Verify total reflects multiple quantities
		const total = await page
			.locator('.cart-summary h4:has-text("Total")')
			.textContent();
		const expectedTotal = (parseFloat(TEST_PRODUCT.price) * 2).toFixed(2);
		expect(total).toContain(expectedTotal);
	});

	test("should remove products from cart", async ({ page }) => {
		// Add product to cart
		await page.click(`text=${TEST_PRODUCT.name}`);
		await page.waitForSelector('button:has-text("ADD TO CART")', {
			state: "visible",
		});
		await page.click('button:has-text("ADD TO CART")');
		await page.waitForSelector(".toast-success", {
			state: "visible",
			timeout: 5000,
		});

		// Go to cart
		await page.click("text=Cart");
		await page.waitForURL("http://localhost:3000/cart");

		// Remove product
		await page.click('button:has-text("Remove")');

		// Wait for cart to update
		await page.waitForTimeout(1000);

		// Verify product is removed
		await expect(page.locator(`text=${TEST_PRODUCT.name}`)).not.toBeVisible();

		// Verify cart is empty message
		await expect(page.locator("text=Your Cart Is Empty")).toBeVisible();
	});

	test("should proceed through checkout process", async ({ page }) => {
		// Add product to cart
		await page.click(`text=${TEST_PRODUCT.name}`);
		await page.waitForSelector('button:has-text("ADD TO CART")', {
			state: "visible",
		});
		await page.click('button:has-text("ADD TO CART")');
		await page.waitForSelector(".toast-success", {
			state: "visible",
			timeout: 5000,
		});

		// Go to cart
		await page.click("text=Cart");
		await page.waitForURL("http://localhost:3000/cart");

		// Verify address is required
		if (await page.locator("text=Update Address").isVisible()) {
			await page.click("text=Update Address");
			await page.waitForSelector('input[name="address"]', { state: "visible" });
			await page.fill('input[name="address"]', "123 Test St");
			await page.click('button:has-text("Update")');
			await page.waitForSelector(".toast-success", {
				state: "visible",
				timeout: 5000,
			});
		}

		// Verify payment section is visible
		await expect(page.locator("text=Payment")).toBeVisible();

		// Verify checkout button is enabled
		await expect(page.locator('button:has-text("Make Payment")')).toBeEnabled();
	});

	test("should filter products by category", async ({ page }) => {
		// Go to categories
		await page.click('a.nav-link.dropdown-toggle:has-text("Categories")');
		await page.waitForSelector(".dropdown-menu", { state: "visible" });

		// Select a category
		await page.click(".dropdown-menu >> text=Electronics");
		await page.waitForURL("http://localhost:3000/category/electronics");

		// Verify filtered products
		await expect(page.locator(".product-link")).toBeVisible();

		// Add filtered product to cart
		await page.click('button:has-text("ADD TO CART")');
		await page.waitForSelector(".toast-success", {
			state: "visible",
			timeout: 5000,
		});

		// Verify cart updated with product from category
		await page.click("text=Cart");
		await page.waitForURL("http://localhost:3000/cart");
		await expect(page.locator(".cart-page")).toContainText("Electronics");
	});
});
