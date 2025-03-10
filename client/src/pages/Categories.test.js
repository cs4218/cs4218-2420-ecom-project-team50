import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Categories from "../pages/Categories";
import useCategory from "../hooks/useCategory";
import "@testing-library/jest-dom/extend-expect";

//Mock useCategory hook
jest.mock("../hooks/useCategory", () => jest.fn());

//Mock component
jest.mock("../components/Layout", () => ({ children }) => (
	<div>{children}</div>
));

describe("Categories Test", () => {
	const mockCategories = [
		{ _id: "1", name: "Electronics", slug: "electronics" },
		{ _id: "2", name: "Clothing", slug: "clothing" },
	];

	beforeEach(() => {
		useCategory.mockReturnValue(mockCategories);
	});

	test("renders category names", () => {
		const { getByText } = render(
			<BrowserRouter>
				<Categories />
			</BrowserRouter>
		);

		mockCategories.forEach((category) => {
			expect(getByText(category.name)).toBeInTheDocument();
		});
	});

	test("renders links", () => {
		const { getAllByRole } = render(
			<BrowserRouter>
				<Categories />
			</BrowserRouter>
		);

		const links = getAllByRole("link");
		expect(links).toHaveLength(mockCategories.length);
		expect(links[0]).toHaveAttribute(
			"href",
			`/category/${mockCategories[0].slug}`
		);
	});

	test("renders empty state message when no categories exist", () => {
		// Mock the hook to return empty array
		useCategory.mockReturnValue([]);

		const { getByText } = render(
			<BrowserRouter>
				<Categories />
			</BrowserRouter>
		);

		// Check if empty state message is displayed
		expect(getByText("No categories found")).toBeInTheDocument();
	});

	/*test("renders categories with unique keys identifier", () => {
		const { container } = render(
			<BrowserRouter>
				<Categories />
			</BrowserRouter>
		);

		const categoryElements = container.querySelectorAll(".col-md-6");
		const keys = Array.from(categoryElements).map((el) =>
			el.getAttribute("key")
		);
		const uniqueKeys = new Set(keys);

		expect(keys.length).toBe(uniqueKeys.size); // Ensure keys are unique size (1) as it is unique
		expect(keys.length).toBe(mockCategories.length); // Ensure the number of keys matches the number of categories (1 per category)
	});*/
});
