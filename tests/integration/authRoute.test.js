import request from 'supertest';
import mongoose from 'mongoose';
import userModel from '../../models/userModel.js';
import orderModel from '../../models/orderModel.js';
import express from 'express';
import { createServer } from 'http';
import authRoutes from '../../routes/authRoute.js';
import productRoutes from '../../routes/productRoutes.js';
import cors from "cors";
import morgan from "morgan";
import { hashPassword } from '../../helpers/authHelper.js';

jest.setTimeout(30000); 

let server;
let app;
let token;
let testUser;
let testAdmin;
let adminToken;
let testOrder;

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
      orderModel.deleteMany({})
    ]);
    
    testAdmin = await userModel.create({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: await hashPassword('cs4218@test.com'),
      phone: '0987654321',
      address: 'Admin Address',
      role: 1,
      answer: 'admin answer'
    });
    
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
      orderModel.deleteMany({})
    ]);
    
    await mongoose.disconnect();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('AfterAll cleanup error:', error);
  }
});

describe('Auth API Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'testuser@example.com',
          password: 'testpassword123',
          phone: '1234567890',
          address: 'Test Address',
          answer: 'test answer'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User Register Successfully');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.email).toBe('testuser@example.com');
      expect(response.body.user.password).not.toBe('testpassword123'); 

      testUser = response.body.user;
    });

    it('should return 409 if user already exists', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'testuser@example.com',
          password: 'testpassword123',
          phone: '1234567890',
          address: 'Test Address',
          answer: 'test answer'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Already registered, please login');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid User',
          email: 'invaliduser@example.com',
          
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('login successfully');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.email).toBe('testuser@example.com');
      expect(response.body.token).toBeDefined();

      token = response.body.token;
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid Password');
    });

    it('should return 404 for non-registered email', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email is not registered');
    });

    it('should return 400 if email and password are missing', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should reset password with valid email and security answer', async () => {
      const response = await request(server)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'testuser@example.com',
          answer: 'test answer',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password Reset Successfully');
    });

    it('should return 404 for wrong email or answer', async () => {
      const response = await request(server)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'testuser@example.com',
          answer: 'wrong answer',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Wrong Email Or Answer');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(server)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'testuser@example.com',
          
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if new password is too short', async () => {
      const response = await request(server)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'testuser@example.com',
          answer: 'test answer',
          newPassword: '12345' 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should allow login with new password after reset', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      token = response.body.token; 
    });
  });

  describe('GET /api/v1/auth/test', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(server)
        .get('/api/v1/auth/test');

      expect(response.status).toBe(401);
    });

    it('should return 401 when authenticated as regular user', async () => {
      const response = await request(server)
        .get('/api/v1/auth/test')
        .set('Authorization', token);

      expect(response.status).toBe(401);
    });

    it('should return success when authenticated as admin', async () => {
      const response = await request(server)
        .get('/api/v1/auth/test')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Protected Routes');
    });
  });

  describe('GET /api/v1/auth/user-auth', () => {
    it('should return success for authenticated user', async () => {
      const response = await request(server)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(server)
        .get('/api/v1/auth/user-auth');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/admin-auth', () => {
    it('should return success for authenticated admin', async () => {
      const response = await request(server)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return 401 when authenticated as regular user', async () => {
      const response = await request(server)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', token);

      expect(response.status).toBe(401);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(server)
        .get('/api/v1/auth/admin-auth');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    it('should update user profile', async () => {
      const response = await request(server)
        .put('/api/v1/auth/profile')
        .set('Authorization', token)
        .send({
          name: 'Updated User',
          phone: '9876543210',
          address: 'Updated Address'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile Updated Successfully');
      expect(response.body.updatedUser.name).toBe('Updated User');
      expect(response.body.updatedUser.phone).toBe('9876543210');
      expect(response.body.updatedUser.address).toBe('Updated Address');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(server)
        .put('/api/v1/auth/profile')
        .send({
          name: 'Unauthorized Update'
        });

      expect(response.status).toBe(401);
    });

    it('should reject profile update with too short password', async () => {
      const response = await request(server)
        .put('/api/v1/auth/profile')
        .set('Authorization', token)
        .send({
          password: '12345' 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should reject email that is already in use', async () => {
      
      await request(server)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123',
          phone: '5555555555',
          address: 'Another Address',
          answer: 'another answer'
        });

      
      const response = await request(server)
        .put('/api/v1/auth/profile')
        .set('Authorization', token)
        .send({
          email: 'another@example.com'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already in use');
    });
  });

  describe('GET /api/v1/auth/orders', () => {
    
    beforeAll(async () => {
      
      const user = await userModel.findOne({ email: 'testuser@example.com' });

      testOrder = await orderModel.create({
        products: [],
        payment: { transaction: { id: 'test-transaction' } },
        buyer: user._id,
        status: 'Not Process'
      });
    });

    it('should get user orders when authenticated', async () => {
      const response = await request(server)
        .get('/api/v1/auth/orders')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User Orders Fetched Successfully');
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.orders.length).toBeGreaterThan(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(server)
        .get('/api/v1/auth/orders');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/all-orders', () => {
    it('should get all orders when authenticated as admin', async () => {
      const response = await request(server)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All Orders Fetched Successfully');
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.orders.length).toBeGreaterThan(0);
    });

    it('should return 401 when authenticated as regular user', async () => {
      const response = await request(server)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', token);

      expect(response.status).toBe(401);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(server)
        .get('/api/v1/auth/all-orders');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/auth/order-status/:orderId', () => {
    it('should update order status when authenticated as admin', async () => {
      const response = await request(server)
        .put(`/api/v1/auth/order-status/${testOrder._id}`)
        .set('Authorization', adminToken)
        .send({
          status: 'Processing'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order Status Updated Successfully');
      expect(response.body.order.status).toBe('Processing');
    });

    it('should return 401 when authenticated as regular user', async () => {
      const response = await request(server)
        .put(`/api/v1/auth/order-status/${testOrder._id}`)
        .set('Authorization', token)
        .send({
          status: 'Shipped'
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(server)
        .put(`/api/v1/auth/order-status/${testOrder._id}`)
        .send({
          status: 'Shipped'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 if status is missing', async () => {
      const response = await request(server)
        .put(`/api/v1/auth/order-status/${testOrder._id}`)
        .set('Authorization', adminToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Status is required');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();
      const response = await request(server)
        .put(`/api/v1/auth/order-status/${fakeOrderId}`)
        .set('Authorization', adminToken)
        .send({
          status: 'Processing'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found');
    });
  });
});
