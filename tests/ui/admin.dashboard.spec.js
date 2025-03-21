import { test, expect } from "@playwright/test";

// Test data
const ADMIN_CREDENTIALS = {
	email: "cs4218@test.com",
	password: "cs4218@test.com",
	name: "CS 4218 TEST ACCOUNT",
};

const TEST_CATEGORY = {
	name: "Test Electronics",
	duplicateName: "Test Electronics",
	updatedName: "Updated Electronics",
};

const TEST_PRODUCT = {
	name: "Test Laptop",
	description: "High performance laptop for testing",
	price: "999",
	quantity: "10",
};

async function loginAsAdmin(page) {
	// Navigate to login page and wait for it to load
	await page.goto("http://localhost:3000/login");

	// Wait for the form to be visible
	await page.waitForSelector("form", { state: "visible" });

	// Fill in login credentials using input type selectors
	await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
	await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);

	// Click login and wait for navigation
	await Promise.all([
		page.waitForResponse((response) =>
			response.url().includes("/api/v1/auth/login")
		),
		page.click('button:has-text("LOGIN")'),
	]);

	// Navigate to admin dashboard
	await page.click(
		`a.nav-link.dropdown-toggle:has-text("${ADMIN_CREDENTIALS.name}")[role="button"]`
	);
	await page.click(".dropdown-menu >> text=Dashboard");

	// Wait for dashboard URL
	await expect(page).toHaveURL("http://localhost:3000/dashboard/admin");
}

test.describe("Admin Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test("should display admin dashboard layout", async ({ page }) => {
		// Verify dashboard title
		await expect(
			page.getByRole("heading", { name: "Admin Panel" })
		).toBeVisible();

		// Verify quick stats are displayed
		await expect(
			page.getByText(`Admin Name : ${ADMIN_CREDENTIALS.name}`)
		).toBeVisible();
		await expect(
			page.getByText(`Admin Email : ${ADMIN_CREDENTIALS.email}`)
		).toBeVisible();
		await expect(page.locator("text=Products")).toBeVisible();
		await expect(page.locator("text=Orders")).toBeVisible();
	});

	test("should navigate to orders management", async ({ page }) => {
		// Click on Orders link in admin menu
		await page.click('a:has-text("Orders")');

		// Verify navigation to orders page
		await expect(page).toHaveURL(
			"http://localhost:3000/dashboard/admin/orders"
		);
		await expect(page.locator("h1")).toContainText("All Orders");
	});

	test("should navigate to products management", async ({ page }) => {
		// Click on Products link in admin menu
		await page.click('a:has-text("Products")');

		// Verify navigation to products page
		await expect(page).toHaveURL(
			"http://localhost:3000/dashboard/admin/products"
		);
		await expect(page.locator("h1")).toContainText("All Products");
	});

	test("should navigate to create product page", async ({ page }) => {
		// Click on Create Product link in admin menu
		await page.click('a:has-text("Create Product")');

		// Verify navigation to create product page
		await expect(page).toHaveURL(
			"http://localhost:3000/dashboard/admin/create-product"
		);
		await expect(page.locator("h1")).toContainText("Create Product");
	});

	test("should navigate to create category page", async ({ page }) => {
		// Click on Create Category link in admin menu
		await page.click('a:has-text("Create Category")');

		// Verify navigation to create category page
		await expect(page).toHaveURL(
			"http://localhost:3000/dashboard/admin/create-category"
		);
		await expect(page.locator("h1")).toContainText("Manage Category");
	});
});
