import { test, expect } from "@playwright/test";

// Test data
const TEST_CATEGORY = {
	name: `Test${Date.now()} Category`,
	updatedName: "Updated Test Category",
};

const TEST_PRODUCT = {
	name: "Test Product",
	description: "Test Description",
	price: 99.99,
	category: TEST_CATEGORY.name,
};

async function loginAsAdmin(page) {
	await page.goto("http://localhost:3000/login");
	await page.fill(
		'input[type="email"]',
		process.env.ADMIN_EMAIL || "cs4218@test.com"
	);
	await page.fill(
		'input[type="password"]',
		process.env.ADMIN_PASSWORD || "cs4218@test.com"
	);

	await page.click('button:has-text("LOGIN")');
	await page.waitForURL("http://localhost:3000");
}

test.describe("Category Management Integration Tests", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto("http://localhost:3000/dashboard/admin/create-category");
	});

	test("should create a new category successfully", async ({ page }) => {
		// Create new category
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');

		await expect(
			page.getByText(`${TEST_CATEGORY.name} is created`)
		).toBeVisible();
	});

	test("should prevent creating duplicate category", async ({ page }) => {
		// Try to create duplicate
		await page.fill('input[placeholder="Enter new category"]', "Book");
		await page.click('button:has-text("Submit")');

		await expect(page.getByText("Category Already Exists")).toBeVisible();
	});

	test("should update category name successfully", async ({ page }) => {
		// Create category first
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');

		// Click edit button for the category
		await page.click(
			`tr:has-text("${TEST_CATEGORY.name}") button:has-text("Edit")`
		);

		// Update category name
		await page.fill(
			'div[class="ant-modal-content"] input[placeholder="Enter new category"]',
			TEST_CATEGORY.updatedName
		);
		await page.click(
			'div[class="ant-modal-content"] button:has-text("Submit")'
		);

		await expect(
			page.getByText(`${TEST_CATEGORY.updatedName} is updated`)
		).toBeVisible();
		// Verify updated name appears
		await expect(
			page.getByRole("cell", { name: TEST_CATEGORY.updatedName })
		).toBeVisible();
	});

	test("should prevent updating to existing category name", async ({
		page,
	}) => {
		// Create first category
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
		// Update category name
		await page.fill(
			'div[class="ant-modal-content"] input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click(
			'div[class="ant-modal-content"] button:has-text("Submit")'
		);

		// Verify error message
		await expect(
			page.getByText(`Category "${TEST_CATEGORY.name}" already exists`)
		).toBeVisible();
	});

	test("should delete category with no products", async ({ page }) => {
		// Create category
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');

		// Delete category
		await page.click(
			`tr:has-text("${TEST_CATEGORY.name}") button:has-text("Delete")`
		);

		// Verify success message
		await expect(page.getByText("Category is deleted")).toBeVisible();

		// Verify category is removed
		await expect(
			page.getByRole("cell", { name: TEST_CATEGORY.name })
		).not.toBeVisible();
	});

	test("should prevent deleting category with products", async ({ page }) => {
		// Create category
		await page.fill(
			'input[placeholder="Enter new category"]',
			TEST_CATEGORY.name
		);
		await page.click('button:has-text("Submit")');
		await expect(
			page.getByText(`${TEST_CATEGORY.name} is created`)
		).toBeVisible();
		// Create product in category
		await page.goto("http://localhost:3000/dashboard/admin/create-product");
		await page.waitForURL(
			"http://localhost:3000/dashboard/admin/create-product"
		);
		// Click the select to open it
		await page.click(`.ant-select-selector:has-text("Select a category")`);

		// Wait for options to appear
		await page.waitForSelector(".ant-select-dropdown", { state: "visible" });

		// Access the input field by its id
		// await page.fill('input[id="rc_select_0"]', TEST_CATEGORY.name);
		// Select category from dropdown
		await page.click('[data-testid="select-category"]');
		await page.waitForSelector(".ant-select-dropdown", { state: "visible" });
		await page.click(`.ant-select-dropdown >> text=${TEST_CATEGORY.name}`);
		await page.fill('input[placeholder="write a name"]', TEST_PRODUCT.name);
		await page.fill(
			'textarea[placeholder="write a description"]',
			TEST_PRODUCT.description
		);
		await page.fill(
			'input[placeholder="write a Price"]',
			TEST_PRODUCT.price.toString()
		);
		await page.fill('input[placeholder = "write a quantity"]', "10");
		await page.click('button:has-text("Create Product")');
		await page.waitForTimeout(2000);
		// Try to delete category
		await page.goto("http://localhost:3000/dashboard/admin/create-category");
		await page.click(
			`tr:has-text("${TEST_CATEGORY.name}") button:has-text("Delete")`
		);

		// Verify error message
		await expect(
			page.getByText("Cannot delete category with products")
		).toBeVisible();
	});
});
