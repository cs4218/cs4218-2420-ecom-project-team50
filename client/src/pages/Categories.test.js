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
});
