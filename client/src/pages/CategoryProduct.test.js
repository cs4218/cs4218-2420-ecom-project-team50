import React from "react";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";

// Mock axios
jest.mock("axios");
//Mock useCategory hook
jest.mock("../hooks/useCategory", () => jest.fn());

//Mock header component
jest.mock("../components/Layout", () => ({ children }) => (
	<div>{children}</div>
));

// Mock Layout component
jest.mock("../components/Layout", () => ({ children }) => (
	<div>{children}</div>
));

describe("CategoryProduct Test", () => {
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
		category: { name: "Electronics" },
	};

	beforeEach(() => {
		// Reset API response
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

	test("renders product with details", async () => {
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
});
