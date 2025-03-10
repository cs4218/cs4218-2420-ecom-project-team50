import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryForm from "./CategoryForm";

describe("CategoryForm Component", () => {
	const mockHandleSubmit = jest.fn((e) => e.preventDefault());
	const mockSetValue = jest.fn();
	const mockValue = "Test Category";

	beforeEach(() => {
		// Clear mock function calls before each test
		jest.clearAllMocks();
	});

	test("renders form elements correctly", () => {
		const { getByPlaceholderText, getByRole } = render(
			<CategoryForm
				handleSubmit={mockHandleSubmit}
				value={mockValue}
				setValue={mockSetValue}
			/>
		);

		// Check if input field exists with correct placeholder and value
		const input = getByPlaceholderText("Enter new category");
		expect(input).toBeInTheDocument();
		expect(input).toHaveValue(mockValue);

		// Check if submit button exists
		const submitButton = getByRole("button", { name: "Submit" });
		expect(submitButton).toBeInTheDocument();
	});

	test("handles input change", () => {
		const { getByPlaceholderText } = render(
			<CategoryForm
				handleSubmit={mockHandleSubmit}
				value={mockValue}
				setValue={mockSetValue}
			/>
		);

		const input = getByPlaceholderText("Enter new category");
		fireEvent.change(input, { target: { value: "New Category" } });

		// Check if setValue was called with new value
		expect(mockSetValue).toHaveBeenCalledWith("New Category");
	});

	test("handles form submission", () => {
		const { getByRole } = render(
			<CategoryForm
				handleSubmit={mockHandleSubmit}
				value={mockValue}
				setValue={mockSetValue}
			/>
		);

		const submitButton = getByRole("button", { name: "Submit" });
		fireEvent.click(submitButton);

		// Check if handleSubmit was called
		expect(mockHandleSubmit).toHaveBeenCalled();
	});
});
