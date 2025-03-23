import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";

import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID || "hmrc3kfrt2xrvtvp",
  publicKey: process.env.BRAINTREE_PUBLIC_KEY || "d3rnqcjwn7zk4fpt",
  privateKey: process.env.BRAINTREE_PRIVATE_KEY || "767ed9ddd903781349d4c2af441f8eaa",
});

const isValidNumber = (num, min = 0) => {
  return !isNaN(num) && Number(num) >= min;
};

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //validation
    switch (true) {
      case !name || !name.trim():
        return res.status(400).send({ error: "Name is Required" });
      case !description || !description.trim():
        return res.status(400).send({ error: "Description is Required" });
      case !price:
        return res.status(400).send({ error: "Price is Required" });
      case !isValidNumber(price, 0):
        return res.status(400).send({ error: "Price must be a non-negative number" });
      case !category:
        return res.status(400).send({ error: "Category is Required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is Required" });
      case !isValidNumber(quantity, 0):
        return res.status(400).send({ error: "Quantity must be a non-negative number" });
      case photo && photo.size > 1000000:
        return res
          .status(400)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    // Check if category exists
    const categoryExists = await categoryModel.exists({ _id: category });
    if (!categoryExists) {
      return res.status(400).send({
        success: false,
        message: "Category not found",
      });
    }

    // Create product with sanitized input
    const products = new productModel({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      quantity: Number(quantity),
      shipping: Boolean(shipping),
      slug: slugify(name)
    });

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      counTotal: products.length,
      message: "All products retrieved",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
};
// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
      return res.status(400).send({
        success: false,
        message: "Invalid product ID",
      });
    }
    const product = await productModel.findById(req.params.pid).select("photo");
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.photo || !product.photo.data) {
      return res.status(404).send({
        success: false,
        message: "No photo available for this product",
      });
    }

    res.set("Content-type", product.photo.contentType);
    return res.status(200).send(product.photo.data);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
      return res.status(400).send({
        success: false,
        message: "Invalid product ID",
      });
    }
    const product =await productModel.findByIdAndDelete(req.params.pid);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

//upate producta
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files || {};

    //alidation
    switch (true) {
      case !name.trim():
        return res.status(400).send({ error: "Name is Required" });
      case !description.trim():
        return res.status(400).send({ error: "Description is Required" });
      case !price:
        return res.status(400).send({ error: "Price is Required" });
      case !isValidNumber(price, 0):
        return res.status(400).send({ error: "Price must be a non-negative number" });
      case !category:
        return res.status(400).send({ error: "Category is Required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is Required" });
      case !isValidNumber(quantity, 0):
        return res.status(400).send({ error: "Quantity must be a non-negative number" });
      case photo && photo.size > 1000000:
        return res
          .status(400)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    const updatedFields = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      quantity: Number(quantity),
      shipping: Boolean(shipping),
      slug: slugify(name)
    };

    if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
      return res.status(400).send({
        success: false,
        message: "Invalid product ID",
      });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      updatedFields,
      { new: true }
    );

    if (!products) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in updating product",
    });
  }
};

// filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked && checked.length > 0) {
      args.category = checked;
    }
    if (radio && radio.length >= 2) {
      args.price = {
        $gte: Number(radio[0]) || 0,
        $lte: Number(radio[1]) || Number.MAX_SAFE_INTEGER
      };
    }
    const products = await productModel.find(args).select("-photo");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while filtering products",
      error,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.countDocuments({});
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;

    const page = /^-?\d+$/.test(req.params.page) ? parseInt(req.params.page) : null;

    if (page == null) {
      return res.status(400).send({
        success: false,
        message: "Page number must be a positive integer",
      });
    }


    if (page < 1) {
      return res.status(400).send({
        success: false,
        message: "Page number must be at least 1",
      });
    }

    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in per page controller",
      error,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    if (!keyword || keyword.trim() === '') {
      return res.status(400).send({
        success: false,
        message: "Search keyword is required",
      });
    }
    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.status(200).send({
      success: true,
      results,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  }
};

// similar products
export const relatedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    // Validate the product exists
    const productExists = await productModel.exists({ _id: pid });
    if (!productExists) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }
    // Validate the category exists
    const categoryExists = await categoryModel.exists({ _id: cid });
    if (!categoryExists) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }
    const products = await productModel
    .find({
      category: cid,
      _id: { $ne: pid },
    })
    .select("-photo")
    .limit(3)
    .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while getting related products",
      error,
    });
  }
};

// Get products by category
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }
    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error While Getting products",
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        return res.status(500).send({
          success: false,
          message: "Error generating token",
          error: err.message
        });
      } 
      res.status(200).send(response);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in generating braintree token",
      error: error.message
    });
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    if (!nonce) {
      return res.status(400).send({
        success: false,
        message: "Payment method nonce is required",
      });
    }
    
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).send({
        success: false,
        message: "Cart items are required",
      });
    }

    // Validate products exist and are in stock
    const counterOfEachProduct = {};
    for (const item of cart) {
      // Check if item._id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(item._id)) {
        console.log(item._id);
        return res.status(400).send({
          success: false,
          message: "Invalid product ID",
        });
      }
      const product = await productModel.findById(item._id);
      if (!product) {
        return res.status(404).send({
          success: false,
          message: `Product not found: ${item.name || item._id}`,
        });
      }

      if (counterOfEachProduct[item._id]) {
        counterOfEachProduct[item._id]++;
      } else {
        counterOfEachProduct[item._id] = 1;
      }

      if (counterOfEachProduct[item._id] > product.quantity) {
        return res.status(400).send({
          success: false,
          message: `Product is out of stock: ${item.name || item._id}`,
        });
      }
    }

    let total = 0;
    cart.map((i) => {
      total += i.price;
    });
    let newTransaction = gateway.transaction.sale(
      {
        amount: total.toFixed(2),
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      async function (error, result) {
        if (result) {
          try {
            // Create order
            const order = new orderModel({
              products: cart,
              payment: result,
              buyer: req.user._id,
            });
            
            await order.save();
            res.json({ ok: true });
          } catch (error) {
            console.log(error);
            res.status(500).send(error);
          }
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};