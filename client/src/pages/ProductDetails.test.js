import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import ProductDetails from "./ProductDetails";

// Mock axios
jest.mock("axios");

// Mock Layout component
jest.mock("../components/Layout", () => ({ children }) => (
	<div>{children}</div>
));

describe("ProductDetails Test", () => {
	const mockProduct = {
		_id: "1",
		name: "Test Product",
		description: "Test Description",
		price: 100,
		category: { name: "Test Category" },
		slug: "test-product",
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock API responses
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-product/")) {
				return Promise.resolve({
					data: {
						success: true,
						product: mockProduct,
					},
				});
			}
			if (url.includes("/related-product/")) {
				return Promise.resolve({
					data: {
						success: true,
						products: [],
					},
				});
			}
			return Promise.reject(new Error("not found"));
		});
	});

	test("renders product details", async () => {
		let rendered;
		await act(async () => {
			rendered = render(
				<MemoryRouter initialEntries={["/product/test-product"]}>
					<Routes>
						<Route path="/product/:slug" element={<ProductDetails />} />
					</Routes>
				</MemoryRouter>
			);
		});

		const { getByText, getByRole } = rendered;

		await waitFor(() => {
			// Check main product details
			expect(getByText("Product Details")).toBeInTheDocument();

			// Using a more flexible text matcher for split content
			expect(
				getByText((content, element) => {
					return (
						element.tagName.toLowerCase() === "h6" &&
						content.includes("Name :") &&
						content.includes("Test Product")
					);
				})
			).toBeInTheDocument();

			expect(
				getByText((content, element) => {
					return (
						element.tagName.toLowerCase() === "h6" &&
						content.includes("Description :") &&
						content.includes("Test Description")
					);
				})
			).toBeInTheDocument();

			// Check price
			expect(
				getByText((content, element) => {
					return (
						element.tagName.toLowerCase() === "h6" &&
						content.includes("Price :") &&
						content.includes("$100.00")
					);
				})
			).toBeInTheDocument();

			// Check category
			expect(
				getByText((content, element) => {
					return (
						element.tagName.toLowerCase() === "h6" &&
						content.includes("Category :") &&
						content.includes("Test Category")
					);
				})
			).toBeInTheDocument();

			// Check if "Add to Cart" button exists
			expect(getByRole("button", { name: "ADD TO CART" })).toBeInTheDocument();
		});
	});

	test("renders similar products component", async () => {
		let rendered;
		await act(async () => {
			rendered = render(
				<MemoryRouter initialEntries={["/product/test-product"]}>
					<Routes>
						<Route path="/product/:slug" element={<ProductDetails />} />
					</Routes>
				</MemoryRouter>
			);
		});

		const { getByText } = rendered;

		await waitFor(() => {
			expect(getByText("Similar Products ➡️")).toBeInTheDocument();
			expect(getByText("No Similar Products found")).toBeInTheDocument();
		});
	});
});
