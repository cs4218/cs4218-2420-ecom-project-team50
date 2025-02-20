import React from "react";
import { render, waitFor, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";
import useCategory from "../hooks/useCategory";
import { useNavigate } from "react-router-dom";
import { screen } from "@testing-library/dom";

// Mock axios
jest.mock("axios");
//Mock useCategory hook
jest.mock("../hooks/useCategory", () => jest.fn());

// Mock Layout component
jest.mock("../components/Layout", () => ({ children }) => (
	<div>{children}</div>
));

// Mock Navigation
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: jest.fn(),
}));

describe("CategoryProduct Test", () => {
	const mockCategory = {
		name: "Electronics",
		slug: "electronics",
	};

	const mockData = {
		products: [
			{
				_id: "1",
				name: "Product 1",
				description: "Description for Product 1",
				price: 50,
				slug: "product-1",
			},
			{
				_id: "2",
				name: "Product 2",
				description: "Description for Product 2",
				price: 75,
				slug: "product-2",
			},
		],
		category: { name: "Electronics", slug: "electronics" },
	};

	beforeEach(() => {
		// Reset API response
		useCategory.mockReturnValue(mockCategory);
		axios.get.mockResolvedValue({ data: mockData });
	});

	test("renders category name and count", async () => {
		const { getByText } = render(
			<MemoryRouter initialEntries={["/category/electronics"]}>
				<Routes>
					<Route path="/category/:slug" element={<CategoryProduct />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(getByText("Category - Electronics")).toBeInTheDocument();
			expect(getByText("2 result found")).toBeInTheDocument();
		});
	});

	test("renders product with its more details button", async () => {
		const { getAllByRole, getByText } = render(
			<MemoryRouter initialEntries={["/category/electronics"]}>
				<Routes>
					<Route path="/category/:slug" element={<CategoryProduct />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			// Check product names
			mockData.products.forEach((product) => {
				expect(getByText(product.name)).toBeInTheDocument();
				expect(
					getByText(`${product.description.substring(0, 60)}...`)
				).toBeInTheDocument();
				expect(
					getByText(
						product.price.toLocaleString("en-US", {
							style: "currency",
							currency: "USD",
						})
					)
				).toBeInTheDocument();
			});

			// Check if "More Details" buttons are present
			const moreDetailsButtons = getAllByRole("button", {
				name: /More Details/i,
			});
			expect(moreDetailsButtons).toHaveLength(mockData.products.length);
		});
	});

	test("renders product images", async () => {
		const { getAllByRole } = render(
			<MemoryRouter initialEntries={["/category/electronics"]}>
				<Routes>
					<Route path="/category/:slug" element={<CategoryProduct />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			const images = getAllByRole("img");
			expect(images).toHaveLength(mockData.products.length);
			images.forEach((img, index) => {
				expect(img).toHaveAttribute(
					"src",
					`/api/v1/product/product-photo/${mockData.products[index]._id}`
				);
				expect(img).toHaveAttribute("alt", mockData.products[index].name);
			});
		});
	});

	test("handles empty list", async () => {
		// Mock API response with empty product list
		axios.get.mockResolvedValueOnce({
			data: {
				products: [],
				category: { name: "Electronics" },
			},
		});

		const { getByText } = render(
			<MemoryRouter initialEntries={["/category/electronics"]}>
				<Routes>
					<Route path="/category/:slug" element={<CategoryProduct />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(getByText("Category - Electronics")).toBeInTheDocument();
			expect(getByText("0 result found")).toBeInTheDocument();
		});
	});

	test("button correctly navigates to product detail page", async () => {
		const mockNavigate = jest.fn(); // Create a mock function for navigate
		useNavigate.mockReturnValue(mockNavigate); // return mock func
		axios.get.mockResolvedValueOnce({
			data: {
				products: [
					{
						_id: "1",
						name: "Product 1",
						description: "Description for Product 1",
						price: 50,
						slug: "product-1",
					},
				],
				category: { name: "Electronics", slug: "electronics" },
			},
		});

		const { getAllByRole, getByText } = render(
			<MemoryRouter initialEntries={["/category/electronics"]}>
				<Routes>
					<Route path="/category/:slug" element={<CategoryProduct />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			const button = getByText("More Details", { selector: "button" });
			fireEvent.click(button);

			// Check if navigation occurred
			expect(mockNavigate).toHaveBeenCalledWith("/product/product-1"); // Verify that the Product Detail page is rendered
		});
	});

	test("handles console log errors", async () => {
		const spy = jest.spyOn(console, "log").mockImplementation(() => {});
		axios.get.mockRejectedValueOnce(new Error("Network Error"));

		const { getByText } = render(
			<MemoryRouter initialEntries={["/category/electronics"]}>
				<Routes>
					<Route path="/category/:slug" element={<CategoryProduct />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(spy).toHaveBeenCalledWith(expect.any(Error)); // Check if console.log was called with an error
		});
		spy.mockRestore();
	});
});
