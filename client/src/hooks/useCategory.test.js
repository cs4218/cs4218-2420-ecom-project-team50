import { renderHook, act } from "@testing-library/react";
import axios from "axios";
import useCategory from "./useCategory";

// Mock axios
jest.mock("axios");

describe("useCategory Hook", () => {
	const mockCategories = [
		{ _id: "1", name: "Electronics", slug: "electronics" },
		{ _id: "2", name: "Clothing", slug: "clothing" },
	];

	beforeEach(() => {
		// Clear mock calls before each test
		jest.clearAllMocks();
	});

	test("fetches categories successfully", async () => {
		// Mock successful API response
		axios.get.mockResolvedValueOnce({
			data: {
				category: mockCategories,
			},
		});

		// Render the hook
		const { result } = renderHook(() => useCategory());

		// Initial state should be empty array
		expect(result.current).toEqual([]);

		// Wait for the API call to resolve
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Check if categories are updated
		expect(result.current).toEqual(mockCategories);
		expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
		expect(axios.get).toHaveBeenCalledTimes(1);
	});

	test("handles API error gracefully", async () => {
		// Spy on console.log
		const consoleSpy = jest.spyOn(console, "log");

		// Mock failed API response
		const error = new Error("API Error");
		axios.get.mockRejectedValueOnce(error);

		// Render the hook
		const { result } = renderHook(() => useCategory());

		// Initial state should be empty array
		expect(result.current).toEqual([]);

		// Wait for the API call to resolve
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// State should still be empty array after error
		expect(result.current).toEqual([]);

		// Check if error was logged
		expect(consoleSpy).toHaveBeenCalledWith(error);
		expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
		expect(axios.get).toHaveBeenCalledTimes(1);

		// Clean up console spy
		consoleSpy.mockRestore();
	});

	test("makes API call only once on mount", async () => {
		// Mock successful API response
		axios.get.mockResolvedValueOnce({
			data: {
				category: mockCategories,
			},
		});

		// Render the hook
		const { result } = renderHook(() => useCategory());

		// Wait for the API call to resolve
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Check if API was called only once
		expect(axios.get).toHaveBeenCalledTimes(1);
	});
});
