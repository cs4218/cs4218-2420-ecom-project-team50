import request from 'supertest';
import mongoose from 'mongoose';
import productModel from '../../models/productModel.js';
import categoryModel from '../../models/categoryModel.js';
import userModel from '../../models/userModel.js';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { createServer } from 'http';
import authRoutes from '../../routes/authRoute.js';
import categoryRoutes from '../../routes/categoryRoutes.js';
import productRoutes from '../../routes/productRoutes.js';
import cors from "cors";
import morgan from "morgan";

// Increase the test timeout
jest.setTimeout(30000); // 30 seconds

let server;
let app;
let token;
let adminToken;
let testUser;
let testAdmin;
let testCategory;
let secondCategory;
let testProduct;

// Set up the MongoDB connection for tests
beforeAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(process.env.MONGO_TEST_URL);
    console.log(`Connected to test database: ${mongoose.connection.name}`);

    // Create express app and configure it
    const app = express();

    //middlewares
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    //routes
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/category", categoryRoutes);
    app.use("/api/v1/product", productRoutes);

    // Create server on random port
    server = createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    console.log(`Test server running on port: ${server.address().port}`);

    // Clear existing test data
    await Promise.all([
      userModel.deleteMany({}),
      categoryModel.deleteMany({}),
      productModel.deleteMany({})
    ]);

    // Create test user and admin
    testUser = await userModel.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: '$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy',
      phone: '1234567890',
      address: 'Test Address',
      answer: 'test answer'
    });

    testAdmin = await userModel.create({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: '$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy',
      phone: '0987654321',
      address: 'Admin Address',
      role: 1,
      answer: 'admin answer'
    });

    // Login to get tokens
    const userResponse = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'testuser@example.com', password: 'cs4218@test.com' });
    token = userResponse.body.token;

    const adminResponse = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'testadmin@example.com', password: 'cs4218@test.com' });
    adminToken = adminResponse.body.token;
  } catch (error) {
    console.error('BeforeAll setup error:', error);
    throw error; // Rethrow to fail tests
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    console.log('Running afterAll cleanup');
    // Close server first to stop any pending requests
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    // Clean up test data
    await Promise.all([
      productModel.deleteMany({}),
      categoryModel.deleteMany({}),
      userModel.deleteMany({})
    ]);

    // Finally disconnect from database
    await mongoose.disconnect();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('AfterAll cleanup error:', error);
  }
});

describe('Product-Category Interaction Tests', () => {
  describe('Category Creation and Management', () => {
    it('should create a category as admin', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${adminToken}`)
        .send({ name: 'Test Category' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe('Test Category');
      testCategory = response.body.category;
    });

    it('should create a second category as admin', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${adminToken}`)
        .send({ name: 'Second Category' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe('Second Category');
      secondCategory = response.body.category;
    });

    it('should not allow creating duplicate categories', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${adminToken}`)
        .send({ name: 'Test Category' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category Already Exists');
    });

    it('should not allow category creation by regular users', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${token}`)
        .send({ name: 'Unauthorized Category' });

      expect(response.status).toBe(401);
    });
  });

  describe('Product Creation within Categories', () => {
    it('should create a product in a category as admin', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.products.name).toBe('Test Product');
      expect(response.body.products.category).toBe(testCategory._id.toString());
      testProduct = response.body.products;
    });

    it('should create a product in the second category as admin', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Second Product')
        .field('description', 'Second Description')
        .field('price', '200')
        .field('category', secondCategory._id.toString())
        .field('quantity', '5')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.products.category).toBe(secondCategory._id.toString());
    });

    it('should reject product creation with invalid category ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Invalid Category Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', invalidId.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
    });
  });

  describe('Category Update with Products', () => {
    it('should update category name without affecting its products', async () => {
      // Update the category name
      const updateResponse = await request(server)
        .put(`/api/v1/category/update-category/${testCategory._id}`)
        .set('Authorization', `${adminToken}`)
        .send({ name: 'Updated Category' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.category.name).toBe('Updated Category');

      testCategory = updateResponse.body.category;

      // Verify product still belongs to the updated category
      const productResponse = await request(server)
        .get(`/api/v1/product/get-product/${testProduct.slug}`);

      expect(productResponse.status).toBe(200);
      expect(productResponse.body.product.category._id).toBe(testCategory._id.toString());
    });

    it('should allow regular users to see updated category', async () => {
      const response = await request(server)
        .get('/api/v1/category/get-category');

      expect(response.status).toBe(200);
      expect(response.body.category.find(c => c._id === testCategory._id).name).toBe('Updated Category');
    });
  });

  describe('Getting Products by Category', () => {
    it('should get all products in a specific category', async () => {
      const response = await request(server)
        .get(`/api/v1/product/product-category/${testCategory.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].name).toBe('Test Product');
    });

    it('should get products from the second category', async () => {
      const response = await request(server)
        .get(`/api/v1/product/product-category/${secondCategory.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].name).toBe('Second Product');
    });

    it('should return 404 for non-existent category slug', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-category/non-existent-category');

      expect(response.status).toBe(404);
    });
  });

  describe('Product Filtering by Category', () => {
    it('should filter products by category ID', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          checked: [testCategory._id.toString()]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].category).toBe(testCategory._id.toString());
    });

    it('should filter products by multiple category IDs', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          checked: [testCategory._id.toString(), secondCategory._id.toString()]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(2);
    });
  });

  describe('Category Deletion with Products', () => {
    it('should not allow deleting a category that contains products', async () => {
      const response = await request(server)
        .delete(`/api/v1/category/delete-category/${testCategory._id}`)
        .set('Authorization', `${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete category with products');
    });

    it('should allow deleting the category after removing its products', async () => {
      // First delete the product in the category
      const deleteProductResponse = await request(server)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', `${adminToken}`);

      expect(deleteProductResponse.status).toBe(200);

      // Now try to delete the category
      const response = await request(server)
        .delete(`/api/v1/category/delete-category/${testCategory._id}`)
        .set('Authorization', `${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category Deleted Successfully');
    });

    it('should not allow regular users to delete categories', async () => {
      const response = await request(server)
        .delete(`/api/v1/category/delete-category/${secondCategory._id}`)
        .set('Authorization', `${token}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle requests with valid token but invalid category ID format', async () => {
      const response = await request(server)
        .delete('/api/v1/category/delete-category/invalid-id-format')
        .set('Authorization', `${adminToken}`);

      expect(response.status).toBe(500);
    });

    it('should handle attempts to update non-existent category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(server)
        .put(`/api/v1/category/update-category/${nonExistentId}`)
        .set('Authorization', `${adminToken}`)
        .send({ name: 'Non-existent Category' });

      // The implementation returns 200 with the category being null
      expect(response.status).toBe(200);
      expect(response.body.category).toBeNull();
    });

    it('should handle getting single category that does not exist', async () => {
      const response = await request(server)
        .get('/api/v1/category/category/non-existent-slug');

      // The implementation might return 200 with null or 404
      if (response.status === 200) {
        expect(response.body.category).toBeNull();
      } else {
        expect(response.status).toBe(404);
      }
    });

    it('should handle product creation with empty category field', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Product Without Category')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Category is Required');
    });
  });
});
