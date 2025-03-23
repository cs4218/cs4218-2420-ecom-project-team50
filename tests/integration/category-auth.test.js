import request from 'supertest';
import mongoose from 'mongoose';
import userModel from '../../models/userModel.js';
import categoryModel from '../../models/categoryModel.js';
import express from 'express';
import { createServer } from 'http';
import authRoutes from '../../routes/authRoute.js';
import categoryRoutes from '../../routes/categoryRoutes.js';
import cors from "cors";
import morgan from "morgan";
import { hashPassword } from '../../helpers/authHelper.js';

jest.setTimeout(30000); 

let server;
let app;
let token;
let adminToken;
let testUser;
let testAdmin;
let testCategory;

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
    app.use("/api/v1/category", categoryRoutes);
    
    server = createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    console.log(`Test server running on port: ${server.address().port}`);
    
    await Promise.all([
      userModel.deleteMany({}),
      categoryModel.deleteMany({})
    ]);
    
    testUser = await userModel.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: await hashPassword('cs4218@test.com'),
      phone: '1234567890',
      address: 'Test Address',
      answer: 'test answer'
    });
    
    testAdmin = await userModel.create({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: await hashPassword('cs4218@test.com'),
      phone: '0987654321',
      address: 'Admin Address',
      role: 1,
      answer: 'admin answer'
    });
    
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

describe('Category-Auth Interaction Tests', () => {
  describe('Category Creation Authorization', () => {
    it('should not allow category creation without authentication', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .send({ name: 'Unauthorized Category' });

      expect(response.status).toBe(401);
    });

    it('should not allow category creation by regular users', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${token}`)
        .send({ name: 'Regular User Category' });

      expect(response.status).toBe(401);
    });

    it('should allow category creation by admin users', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${adminToken}`)
        .send({ name: 'Test Category' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('new category created');
      expect(response.body.category.name).toBe('Test Category');

      testCategory = response.body.category;
    });

    it('should reject category creation with invalid data', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${adminToken}`)
        .send({}); 

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Name is required');
    });

    it('should reject duplicate category creation', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${adminToken}`)
        .send({ name: 'Test Category' }); 

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category Already Exists');
    });
  });

  describe('Category Update Authorization', () => {
    it('should not allow category update without authentication', async () => {
      const response = await request(server)
        .put(`/api/v1/category/update-category/${testCategory._id}`)
        .send({ name: 'Updated Unauthorized' });

      expect(response.status).toBe(401);
    });

    it('should not allow category update by regular users', async () => {
      const response = await request(server)
        .put(`/api/v1/category/update-category/${testCategory._id}`)
        .set('Authorization', `${token}`)
        .send({ name: 'Updated By Regular User' });

      expect(response.status).toBe(401);
    });

    it('should allow category update by admin users', async () => {
      const response = await request(server)
        .put(`/api/v1/category/update-category/${testCategory._id}`)
        .set('Authorization', `${adminToken}`)
        .send({ name: 'Updated Test Category' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category Updated Successfully');
      expect(response.body.category.name).toBe('Updated Test Category');

      testCategory = response.body.category;
    });

    it('should handle updating non-existent category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(server)
        .put(`/api/v1/category/update-category/${nonExistentId}`)
        .set('Authorization', `${adminToken}`)
        .send({ name: 'Non-existent Category' });

      expect(response.status).toBe(200);
      expect(response.body.category).toBeNull();
    });
  });

  describe('Public Category Endpoints', () => {
    it('should allow access to all categories without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/category/get-category');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All Categories List');
      expect(Array.isArray(response.body.category)).toBe(true);
    });

    it('should allow access to single category without authentication', async () => {
      const response = await request(server)
        .get(`/api/v1/category/single-category/${testCategory.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Get Single Category Successfully');
      expect(response.body.category.name).toBe('Updated Test Category');
    });

    it('should handle requesting non-existent category', async () => {
      const response = await request(server)
        .get('/api/v1/category/single-category/non-existent-slug');

      
      if (response.status === 200) {
        expect(response.body.category).toBeNull();
      } else {
        expect(response.status).not.toBe(200);
      }
    });
  });

  describe('Category Deletion Authorization', () => {
    it('should not allow category deletion without authentication', async () => {
      const response = await request(server)
        .delete(`/api/v1/category/delete-category/${testCategory._id}`);

      expect(response.status).toBe(401);
    });

    it('should not allow category deletion by regular users', async () => {
      const response = await request(server)
        .delete(`/api/v1/category/delete-category/${testCategory._id}`)
        .set('Authorization', `${token}`);

      expect(response.status).toBe(401);
    });

    it('should allow category deletion by admin users', async () => {
      const response = await request(server)
        .delete(`/api/v1/category/delete-category/${testCategory._id}`)
        .set('Authorization', `${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category Deleted Successfully');
    });

    it('should handle deleting non-existent category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(server)
        .delete(`/api/v1/category/delete-category/${nonExistentId}`)
        .set('Authorization', `${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });
  });

  describe('Token Validation and Authentication Edge Cases', () => {
    it('should reject requests with invalid token format', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', 'invalid-token-format')
        .send({ name: 'Invalid Token Category' });

      expect(response.status).toBe(401);
    });

    it('should reject requests with expired or tampered tokens', async () => {
      
      const tamperedToken = adminToken.slice(0, -5) + 'XXXXX';

      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${tamperedToken}`)
        .send({ name: 'Tampered Token Category' });

      expect(response.status).toBe(401);
    });
  });

  describe('Category Management with User Role Changes', () => {
    let regularUserPromotedToAdmin;
    let promotedUserToken;
    let promotedAdminToken;

    beforeAll(async () => {
      
      regularUserPromotedToAdmin = await userModel.create({
        name: 'Regular User To Promote',
        email: 'promoteme@example.com',
        password: await hashPassword('cs4218@test.com'),
        phone: '5555555555',
        address: 'Promotion Address',
        answer: 'promote me'
      });
 
      const userResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: 'promoteme@example.com', password: 'cs4218@test.com' });
      promotedUserToken = userResponse.body.token;
    });

    it('should not allow category creation by new regular user', async () => {
      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${promotedUserToken}`)
        .send({ name: 'Before Promotion Category' });

      expect(response.status).toBe(401);
    });

    it('should allow category creation after user is promoted to admin', async () => {
      
      await userModel.findByIdAndUpdate(
        regularUserPromotedToAdmin._id,
        { role: 1 }
      );
      
      const adminResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: 'promoteme@example.com', password: 'cs4218@test.com' });
      promotedAdminToken = adminResponse.body.token;

      const response = await request(server)
        .post('/api/v1/category/create-category')
        .set('Authorization', `${promotedAdminToken}`)
        .send({ name: 'After Promotion Category' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe('After Promotion Category');
    });
  });
});
