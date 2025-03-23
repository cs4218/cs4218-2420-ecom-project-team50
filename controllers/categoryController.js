import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import slugify from "slugify";

export const createCategoryController = async (req, res) => {
	try {
		const { name } = req.body;
		if (!name) {
			return res.status(401).send({ message: "Name is required" });
		}
		const existingCategory = await categoryModel.findOne({ name });
		if (existingCategory) {
			return res.status(200).send({
				success: false,
				message: "Category Already Exists",
			});
		}
		const category = await new categoryModel({
			name,
			slug: slugify(name),
		}).save();
		res.status(200).send({
			success: true,
			message: "new category created",
			category,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			error,
			message: "Error in Category",
		});
	}
};

//update category
export const updateCategoryController = async (req, res) => {
	try {
		const { name } = req.body;
		const { id } = req.params;
		const category = await categoryModel.findByIdAndUpdate(
			id,
			{ name, slug: slugify(name) },
			{ new: true }
		);
		res.status(200).send({
			success: true,
			message: "Category Updated Successfully",
			category,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			error,
			message: "Error while updating category",
		});
	}
};

// get all cat
export const categoryControlller = async (req, res) => {
	try {
		const category = await categoryModel.find({});
		res.status(200).send({
			success: true,
			message: "All Categories List",
			category,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			error,
			message: "Error while getting all categories",
		});
	}
};

// single category
export const singleCategoryController = async (req, res) => {
	try {
		const category = await categoryModel.findOne({ slug: req.params.slug });
		res.status(200).send({
			success: true,
			message: "Get Single Category Successfully",
			category,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			error,
			message: "Error While getting Single Category",
		});
	}
};

//delete category
export const deleteCategoryCOntroller = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if category exists
		const category = await categoryModel.findById(id);
		if (!category) {
			return res.status(404).send({
				success: false,
				message: "Category not found",
			});
		}

		// Check if there are any products in this category
		const productsInCategory = await productModel.find({ category: id });

		if (productsInCategory.length > 0) {
			return res.status(400).send({
				success: false,
				message: "Cannot delete category with products",
			});
		}

		// If no products found, proceed with deletion
		const deleteCategory = await categoryModel.findByIdAndDelete(id);
		res.status(200).send({
			success: true,
			message: "Category Deleted Successfully",
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			message: "Cannot delete category with products",
			error,
		});
	}
};
