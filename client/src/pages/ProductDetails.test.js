import React from "react";
import { render, waitFor, act, fireEvent } from "@testing-library/react";
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
			if (url.includes("/get-product/test-product")) {
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
		let renders;
		await act(async () => {
			renders = render(
				<MemoryRouter initialEntries={["/product/test-product"]}>
					<Routes>
						<Route path="/product/:slug" element={<ProductDetails />} />
					</Routes>
				</MemoryRouter>
			);
		});
		const { getByText, getByRole } = renders;
		await waitFor(() => {
			// Check main product details
			expect(getByText("Product Details")).toBeInTheDocument();

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

	test("User is able to add product to Cart", async () => {
		const mockAddToCart = jest.fn(); // Create a mock function for add to cart
		let renders;
		await act(async () => {
			renders = render(
				<MemoryRouter initialEntries={["/product/test-product"]}>
					<Routes>
						<Route path="/product/:slug" element={<ProductDetails />} />
					</Routes>
				</MemoryRouter>
			);
		});

		const { getByText } = renders;

		await waitFor(() => {
			expect(getByText("Name : Test Product")).toBeInTheDocument(); // Ensure product name is displayed

			// Find the "Add to Cart" button
			const addToCartButton = getByText("ADD TO CART", { selector: "button" });

			// Simulate a click event
			fireEvent.click(addToCartButton);

			// expect(mockAddToCart).toHaveBeenCalledWith(mockProduct); // Mock addtoCart function to show event ran
		});
		expect(await getByText("Item Added to cart")).toBeInTheDocument();
	});

	test("renders similar products component", async () => {
		let renders;
		await act(async () => {
			renders = render(
				<MemoryRouter initialEntries={["/product/test-product"]}>
					<Routes>
						<Route path="/product/:slug" element={<ProductDetails />} />
					</Routes>
				</MemoryRouter>
			);
		});

		const { getByText } = renders;

		await waitFor(() => {
			expect(getByText("Similar Products ➡️")).toBeInTheDocument();
			expect(getByText("No Similar Products found")).toBeInTheDocument();
		});
	});

	test("errors are logged when failing to fetch product details", async () => {
		const spy = jest.spyOn(console, "log").mockImplementation(() => {}); // Spy on console.log

		// Mock API response to simulate an error
		axios.get.mockImplementationOnce((url) => {
			if (url.includes("/related-product/")) {
				return Promise.reject(new Error("Failed to fetch product details"));
			}
		});

		await act(async () => {
			render(
				<MemoryRouter initialEntries={["/product/test-product"]}>
					<Routes>
						<Route path="/product/:slug" element={<ProductDetails />} />
					</Routes>
				</MemoryRouter>
			);
		});

		// Assert that the error is logged to the console
		await waitFor(() => {
			expect(spy).toHaveBeenCalledWith(expect.any(Error));
		});

		spy.mockRestore();
	});
});
