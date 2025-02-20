import { jest } from "@jest/globals";
import categoryModel from "../models/categoryModel";

import {
	createCategoryController,
	updateCategoryController,
	categoryControlller,
	singleCategoryController,
	deleteCategoryCOntroller,
} from "./categoryController";

jest.mock("../models/categoryModel");

describe("Category Controller", () => {
	let mockReq;
	let mockRes;

	beforeEach(() => {
		mockRes = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};
		mockReq = {
			body: { name: "Updated Category" },
			params: { id: "123" },
		};
	});

	test("createCategory success", async () => {
		mockReq.body = { name: "Test Category" };
		categoryModel.findOne.mockResolvedValue(null); // No existing category
		categoryModel.prototype.save.mockResolvedValue({
			name: "Test Category",
			slug: "test-category",
		});

		await createCategoryController(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				message: "new category created",
			})
		);
	});

	test("createCategory without name", async () => {
		mockReq.body = {};
		categoryModel.findOne.mockResolvedValue(null); // No existing category

		await createCategoryController(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.send).toHaveBeenCalledWith({
			message: "Name is required",
		});
	});

	test("createCategory failure due to duplicate", async () => {
		mockReq.body = { name: "Existing Category" };
		categoryModel.findOne.mockResolvedValue({ name: "Existing Category" }); // Simulate existing category

		await createCategoryController(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: false,
			message: "Category Already Exists",
		});
	});

	test("createCategory logs error correctly", async () => {
		const spy = jest.spyOn(console, "log").mockImplementation(() => {}); // Spy on console.log

		mockReq.body = { name: "Test Category" };
		categoryModel.findOne.mockResolvedValue(null); // No existing category
		categoryModel.prototype.save.mockRejectedValue(new Error("Database error")); // Simulate a save error

		await createCategoryController(mockReq, mockRes);

		expect(spy).toHaveBeenCalledWith(expect.stringContaining("Database error"));

		// Verify response for error handling
		expect(mockRes.status).toHaveBeenCalledWith(500);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: false,
			message: "Error in Category",
			error: expect.any(Error),
		});

		spy.mockRestore(); // Restore the original console.log implementation
	});

	test("getAllCategories success", async () => {
		const mockCategories = [{ name: "Category 1" }, { name: "Category 2" }];
		categoryModel.find.mockResolvedValue(mockCategories);

		await categoryControlller(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: true,
			message: "All Categories List",
			category: mockCategories,
		});
	});

	test("categorycontroller failure", async () => {
		const spy = jest.spyOn(console, "log").mockImplementation(() => {}); // Spy on console.log
		categoryModel.find.mockRejectedValue(new Error("Database error"));

		await categoryControlller(mockReq, mockRes);

		expect(spy).toHaveBeenCalledWith(expect.any(Error));
		// Verify response for error handling
		expect(mockRes.status).toHaveBeenCalledWith(500);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: false,
			message: "Error while getting all categories",
			error: expect.any(Error),
		});

		spy.mockRestore(); // Restore the original console.log implementation
	});

	test("successfully updates a category", async () => {
		const updatedCategory = {
			_id: "123",
			name: "Updated Category",
			slug: "updated-category",
		};

		// Mock the findByIdAndUpdate method
		categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

		await updateCategoryController(mockReq, mockRes);

		// Verify findByIdAndUpdate was called with correct parameters
		expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
			"123",
			{ name: "Updated Category", slug: expect.any(String) },
			{ new: true }
		);

		// Verify response
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: true,
			message: "Category Updated Successfully",
			category: updatedCategory,
		});
	});

	test("handles errors when updating category", async () => {
		// Mock the findByIdAndUpdate method to throw an error
		const error = new Error("Database error");
		categoryModel.findByIdAndUpdate.mockRejectedValue(error);

		await updateCategoryController(mockReq, mockRes);

		// Verify error response
		expect(mockRes.status).toHaveBeenCalledWith(500);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: false,
			error,
			message: "Error while updating category",
		});
	});

	test("singleCategoryController success", async () => {
		const mockCategory = {
			name: "Test Category",
			slug: "test-category",
		};
		mockReq.params = { slug: "test-category" };
		categoryModel.findOne.mockResolvedValue({
			name: "Test Category",
			slug: "test-category",
		});

		await singleCategoryController(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: true,
			message: "Get Single Category Successfully",
			category: mockCategory,
		});
	});

	test("singleCategoryController handles error correctly", async () => {
		const spy = jest.spyOn(console, "log").mockImplementation(() => {}); // Spy on console.log

		// Simulate an error when finding the category
		categoryModel.findOne.mockRejectedValue(new Error("Database error"));

		await singleCategoryController(mockReq, mockRes);

		// Assert that the error is logged to the console
		expect(spy).toHaveBeenCalledWith(expect.any(Error));

		// Verify response for error handling
		expect(mockRes.status).toHaveBeenCalledWith(500);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: false,
			message: "Error While getting Single Category",
			error: expect.any(Error),
		});

		spy.mockRestore(); // Restore the original console.log implementation
	});

	test("deleteCategory success", async () => {
		mockReq.params = { id: "123" };
		categoryModel.findByIdAndDelete.mockResolvedValue({}); // Simulate successful deletion

		await deleteCategoryCOntroller(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: true,
			message: "Category Deleted Successfully",
		});
	});

	test("deleteCategory failure", async () => {
		mockReq.params = { id: "invalid-id" };
		categoryModel.findByIdAndDelete.mockResolvedValue(null); // Simulate category not found

		await deleteCategoryCOntroller(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(404);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: false,
			message: "Category not found",
		});
	});

	test("deleteCategory error", async () => {
		const error = new Error("Database error");
		categoryModel.findByIdAndDelete.mockRejectedValue(error);

		await deleteCategoryCOntroller(mockReq, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(500);
		expect(mockRes.send).toHaveBeenCalledWith({
			success: false,
			error: expect.any(Error),
			message: "error while deleting category",
		});
	});
});
