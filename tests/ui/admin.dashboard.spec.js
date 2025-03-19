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

	test("should navigate to users management", async ({ page }) => {
		// Click on Users link in admin menu
		await page.click('a:has-text("Users")');

		// Verify navigation to users page
		await expect(page).toHaveURL("http://localhost:3000/dashboard/admin/users");
		await expect(page.locator("h1")).toContainText("All Users");
	});

	test("should display admin profile information", async ({ page }) => {
		// Click on Admin Profile link in admin menu
		await page.click('a:has-text("Admin Profile")');

		// Verify navigation to admin profile page
		await expect(page).toHaveURL(
			"http://localhost:3000/dashboard/admin/profile"
		);

		// Verify profile information is displayed
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[name="name"]')).toBeVisible();
	});

	test("should display dashboard statistics", async ({ page }) => {
		// Verify statistics cards are visible
		await expect(page.locator(".card-title")).toContainText([
			"Products",
			"Categories",
			"Orders",
		]);

		// Verify statistics values are numbers
		const productCount = await page
			.locator('.card:has-text("Products")')
			.textContent();
		expect(productCount).toMatch(/\d+/);

		const categoryCount = await page
			.locator('.card:has-text("Categories")')
			.textContent();
		expect(categoryCount).toMatch(/\d+/);

		const orderCount = await page
			.locator('.card:has-text("Orders")')
			.textContent();
		expect(orderCount).toMatch(/\d+/);
	});

	test("should show recent orders on dashboard", async ({ page }) => {
		// Verify recent orders section is visible
		await expect(page.locator("h2:has-text('Recent Orders')")).toBeVisible();

		// Verify orders table or empty state is present
		const hasOrders = await page.locator("table").isVisible();
		if (hasOrders) {
			await expect(page.locator("th")).toContainText([
				"Order ID",
				"Status",
				"Buyer",
				"Date",
				"Payment",
				"Quantity",
			]);
		} else {
			await expect(page.locator("p")).toContainText("No recent orders");
		}
	});

	test("should allow quick actions from dashboard", async ({ page }) => {
		// Verify quick action buttons are present
		await expect(page.locator('a:has-text("Add Product")')).toBeVisible();
		await expect(page.locator('a:has-text("Manage Categories")')).toBeVisible();
		await expect(page.locator('a:has-text("View Orders")')).toBeVisible();

		// Click on Add Product button
		await page.click('a:has-text("Add Product")');

		// Verify navigation to create product page
		await expect(page).toHaveURL(
			"http://localhost:3000/dashboard/admin/create-product"
		);
	});

	test("should display sales analytics", async ({ page }) => {
		// Verify sales analytics section is visible
		await expect(page.locator("h2:has-text('Sales Analytics')")).toBeVisible();

		// Verify analytics chart or placeholder is present
		const hasChart = await page.locator(".analytics-chart").isVisible();
		if (hasChart) {
			await expect(page.locator(".analytics-chart")).toBeVisible();
		} else {
			await expect(page.locator("p")).toContainText("No sales data available");
		}
	});

	test("should create new category successfully", async ({ page }) => {
		// Navigate to create category
		await page.click("text=Create Category");

		// Fill and submit category form
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');

		// Verify success message
		await expect(page.locator(".toast-success")).toContainText(
			"Category created successfully"
		);

		// Verify category appears in list
		await expect(page.getByText(TEST_CATEGORY.name)).toBeVisible();
	});

	test("should delete category with no products", async ({ page }) => {
		// First create a category
		await page.click("text=Create Category");
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');

		// Wait for category to be created
		await expect(page.getByText(TEST_CATEGORY.name)).toBeVisible();

		// Delete the category
		await page.click(
			`tr:has-text("${TEST_CATEGORY.name}") button:has-text("Delete")`
		);

		// Confirm deletion in modal
		await page.click('button:has-text("Yes, delete it!")');

		// Verify success message
		await expect(page.locator(".toast-success")).toContainText(
			"Category deleted successfully"
		);

		// Verify category is removed from list
		await expect(page.getByText(TEST_CATEGORY.name)).not.toBeVisible();
	});

	test("should not allow deleting category with products", async ({ page }) => {
		// Create category
		await page.click("text=Create Category");
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');

		// Create product in that category
		await page.click("text=Create Product");
		await page.fill('input[name="name"]', TEST_PRODUCT.name);
		await page.fill('textarea[name="description"]', TEST_PRODUCT.description);
		await page.fill('input[name="price"]', TEST_PRODUCT.price);
		await page.fill('input[name="quantity"]', TEST_PRODUCT.quantity);
		await page.selectOption('select[name="category"]', TEST_CATEGORY.name);

		// Upload product image
		const fileInput = await page.locator('input[type="file"]');
		await fileInput.setInputFiles("tests/fixtures/test-image.jpg");

		await page.click('button:has-text("Create Product")');

		// Try to delete category
		await page.click("text=Create Category"); // Go back to categories
		await page.click(
			`tr:has-text("${TEST_CATEGORY.name}") button:has-text("Delete")`
		);

		// Verify error message
		await expect(page.locator(".toast-error")).toContainText(
			"Cannot delete category with products"
		);
	});

	test("should not allow creating category with existing name", async ({
		page,
	}) => {
		// Create first category
		await page.click("text=Create Category");
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');

		// Try to create category with same name
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.duplicateName
		);
		await page.click('button:has-text("Submit")');

		// Verify error message
		await expect(page.locator(".toast-error")).toContainText(
			"Category already exists"
		);
	});

	test("should not allow updating category to existing name", async ({
		page,
	}) => {
		// Create first category
		await page.click("text=Create Category");
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');

		// Create second category
		await page.fill(
			'input[placeholder="Enter new category"]',
			"Second Category"
		);
		await page.click('button:has-text("Submit")');

		// Try to update second category to first category's name
		await page.click('tr:has-text("Second Category") button:has-text("Edit")');
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Update")');

		// Verify error message
		await expect(page.locator(".toast-error")).toContainText(
			"Category already exists"
		);
	});

	test("should update product category and reflect changes", async ({
		page,
	}) => {
		// Create first category
		await page.click("text=Create Category");
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');

		// Create product
		await page.click("text=Create Product");
		await page.fill('input[name="name"]', TEST_PRODUCT.name);
		await page.fill('textarea[name="description"]', TEST_PRODUCT.description);
		await page.fill('input[name="price"]', TEST_PRODUCT.price);
		await page.fill('input[name="quantity"]', TEST_PRODUCT.quantity);
		await page.selectOption('select[name="category"]', TEST_CATEGORY.name);

		// Upload product image
		const fileInput = await page.locator('input[type="file"]');
		await fileInput.setInputFiles("tests/fixtures/test-image.jpg");

		await page.click('button:has-text("Create Product")');

		// Create new category
		await page.click("text=Create Category");
		await page.fill('input[placeholder="Enter new category"]', "New Category");
		await page.click('button:has-text("Submit")');

		// Update product's category
		await page.click("text=Products");
		await page.click(
			`tr:has-text("${TEST_PRODUCT.name}") button:has-text("Edit")`
		);
		await page.selectOption('select[name="category"]', "New Category");
		await page.click('button:has-text("Update Product")');

		// View product details
		await page.click(
			`tr:has-text("${TEST_PRODUCT.name}") a:has-text("Details")`
		);

		// Verify category is updated
		await expect(page.locator("text=Category")).toContainText("New Category");
	});
});
