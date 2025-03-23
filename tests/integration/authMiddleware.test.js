import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import userModel from '../../models/userModel.js';
import categoryModel from '../../models/categoryModel.js';
import express from 'express';
import { createServer } from 'http';
import authRoutes from '../../routes/authRoute.js';
import productRoutes from '../../routes/productRoutes.js';
import cors from "cors";
import morgan from "morgan";
import path from 'path';

jest.setTimeout(30000);

let server;
let testCategory;
let testUser;
let testAdmin;
let userToken;
let adminToken;
let invalidToken;
let expiredToken;

beforeAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(process.env.MONGO_TEST_URL);
    console.log(`Connected to test database: ${mongoose.connection.name}`);

    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/product", productRoutes);

    server = createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    console.log(`Test server running on port: ${server.address().port}`);

    await Promise.all([
      userModel.deleteMany({}),
      categoryModel.deleteMany({})
    ]);

    testCategory = await categoryModel.create({
      name: 'Test Category',
      slug: 'test-category'
    });

    testUser = await userModel.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: '$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy', // cs4218@test.com
      phone: '1234567890',
      address: 'Test Address',
      role: 0, 
      answer: 'test answer'
    });

    testAdmin = await userModel.create({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: '$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy', // cs4218@test.com
      phone: '0987654321',
      address: 'Admin Address',
      role: 1, 
      answer: 'admin answer'
    });

    const userResponse = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'testuser@example.com', password: 'cs4218@test.com' });
    userToken = userResponse.body.token;

    const adminResponse = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'testadmin@example.com', password: 'cs4218@test.com' });
    adminToken = adminResponse.body.token;

    invalidToken = 'invalid.token.format';

    expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.1jC-iV9pSlSKV3nLHR2TnTLQYJXXgzXjcwf2DxOZ8eY';

  } catch (error) {
    console.error('BeforeAll setup error:', error);
    throw error; 
  }
});

afterAll(async () => {
  try {
    console.log('Running afterAll cleanup');
    
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    await Promise.all([
      userModel.deleteMany({}),
      categoryModel.deleteMany({})
    ]);

    await mongoose.disconnect();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('AfterAll cleanup error:', error);
  }
});

describe('Auth Middleware Integration Tests', () => {
  
  describe('requireSignIn Middleware', () => {
    it('should allow access with valid admin token', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect([201, 400]).toContain(response.status);
      expect(response.status).not.toBe(401); 
    });

    it('should reject access when no token is provided', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject access with invalid token format', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', invalidToken)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject access with expired token', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', expiredToken)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('isAdmin Middleware', () => {
    it('should reject regular user attempting admin operations', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', userToken)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('UnAuthorized Access');
    });

    it('should allow admin user to perform admin operations', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Admin Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Auth Middleware Edge Cases', () => {
    it('should handle token with valid format but wrong signature', async () => {
      // This token has correct format but was signed with a different secret
      const wrongSignatureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZjgzNzM5ZDJiYWYwMDAwMDlhODJkMjUiLCJpYXQiOjE2MTI0OTMyODEsImV4cCI6MTYxMzEwMjg4MX0.wNpxD9YuZztur8dGBXhHj2OQMxvIwKBx7ftlvbmx8KI';
      
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', wrongSignatureToken)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle user that no longer exists in the database', async () => {
      const tempUser = await userModel.create({
        name: 'Temp Admin',
        email: 'tempadmin@example.com',
        password: '$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy',
        phone: '1122334455',
        address: 'Temp Address',
        role: 1,
        answer: 'temp answer'
      });

      const tempResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: 'tempadmin@example.com', password: 'cs4218@test.com' });
      const tempToken = tempResponse.body.token;

      await userModel.findByIdAndDelete(tempUser._id);

      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', tempToken)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect(response.status).toBe(401);
    });

    it('should handle user role change after token issuance', async () => {
      const tempAdmin = await userModel.create({
        name: 'Role Change Admin',
        email: 'rolechange@example.com',
        password: '$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy',
        phone: '9988776655',
        address: 'Role Change Address',
        role: 1,
        answer: 'role answer'
      });

      const tempResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: 'rolechange@example.com', password: 'cs4218@test.com' });
      const tempAdminToken = tempResponse.body.token;

      await userModel.findByIdAndUpdate(tempAdmin._id, { role: 0 });

      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', tempAdminToken)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('UnAuthorized Access');
    });
  });

  describe('Auth Header Format Tests', () => {
    it('should handle token with "Bearer " prefix', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect([201, 400, 401]).toContain(response.status);
    });

    it('should reject empty authorization header', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', '')
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Product Routes with Different HTTP Methods', () => {
    it('should enforce admin check on PUT product update', async () => {
      const createResponse = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Product To Update')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
      
      const productId = createResponse.body.products._id;
      
      // Try to update as regular user
      const updateResponse = await request(server)
        .put(`/api/v1/product/update-product/${productId}`)
        .set('Authorization', userToken)
        .field('name', 'Updated Product Name')
        .field('description', 'Updated Description')
        .field('price', '200')
        .field('category', testCategory._id.toString())
        .field('quantity', '20')
        .field('shipping', 'true');
      
      expect(updateResponse.status).toBe(401);
      expect(updateResponse.body.success).toBe(false);
    });

    it('should enforce admin check on DELETE product', async () => {
      const createResponse = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Product To Delete')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
      
      const productId = createResponse.body.products._id;
      
      const deleteResponse = await request(server)
        .delete(`/api/v1/product/delete-product/${productId}`)
        .set('Authorization', userToken);
      
      expect(deleteResponse.status).toBe(401);
      expect(deleteResponse.body.success).toBe(false);
    });
  });
});
