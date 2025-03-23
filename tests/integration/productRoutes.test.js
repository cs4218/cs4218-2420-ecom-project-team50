
import request from 'supertest';
import mongoose from 'mongoose';
import productModel from '../../models/productModel.js';
import categoryModel from '../../models/categoryModel.js';
import userModel from '../../models/userModel.js';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { createServer } from 'http';
import authRoutes from '../../routes/authRoute.js'
import categoryRoutes from '../../routes/categoryRoutes.js'
import productRoutes from '../../routes/productRoutes.js'
import cors from "cors";
import morgan from "morgan";


jest.setTimeout(30000); 


let server;
let app;
let token;
let testCategory;
let testProduct;
let testUser;
let testAdmin;
let adminToken;


beforeAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(process.env.MONGO_TEST_URL);
    console.log(`Connected to test database: ${mongoose.connection.name}`);

    
    const app = express();

    //middlewares
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    //routes
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/category", categoryRoutes);
    app.use("/api/v1/product", productRoutes);

    
    server = createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    console.log(`Test server running on port: ${server.address().port}`);

    
    await Promise.all([
      userModel.deleteMany({}),
      categoryModel.deleteMany({}),
      productModel.deleteMany({})
    ]);

    
    testCategory = await categoryModel.create({
      name: 'Test Category',
      slug: 'test-category'
    });

    
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
      productModel.deleteMany({}),
      categoryModel.deleteMany({}),
      userModel.deleteMany({})
    ]);

    
    await mongoose.disconnect();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('AfterAll cleanup error:', error);
  }
});

describe('Product API Endpoints', () => {
  describe('POST /api/v1/product/create-product', () => {
    it('should create a new product when logged in as admin', async () => {
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
      testProduct = response.body.products;
    });

    it('should return 401 when not logged in', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .field('name', 'Unauthorized Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      expect(response.status).toBe(401);
    });

    it('should return 401 when logged in as regular user', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${token}`)
        .field('name', 'Forbidden Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/product/get-product', () => {
    it('should return all products', async () => {
      const response = await request(server)
        .get('/api/v1/product/get-product');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('GET /api/v1/product/get-product/:slug', () => {
    it('should return a specific product by slug', async () => {
      const response = await request(server)
        .get(`/api/v1/product/get-product/${testProduct.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe(testProduct.name);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(server)
        .get('/api/v1/product/get-product/non-existent-product');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/product/product-photo/:pid', () => {
    it('should return product photo', async () => {
      const response = await request(server)
        .get(`/api/v1/product/product-photo/${testProduct._id}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/image/);
    });

    it('should return 404 for non-existent product photo', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-photo/60d21b4667d0d8992e610c85');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/product/update-product/:pid', () => {
    it('should update product when logged in as admin', async () => {
      const response = await request(server)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', `${adminToken}`)
        .field('name', 'Updated Product')
        .field('description', testProduct.description)
        .field('price', testProduct.price)
        .field('category', testProduct.category)
        .field('quantity', testProduct.quantity)
        .field('shipping', testProduct.shipping);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.products.name).toBe('Updated Product');
    });

    it('should return 401 when not logged in', async () => {
      const response = await request(server)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .field('name', 'Unauthorized Product')
        .field('description', testProduct.description)
        .field('price', testProduct.price)
        .field('category', testProduct.category)
        .field('quantity', testProduct.quantity)
        .field('shipping', testProduct.shipping);
      expect(response.status).toBe(401);
    });

    it('should return 401 when logged in as regular user', async () => {
      const response = await request(server)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', `${token}`)
        .field('name', 'Forbidden Product')
        .field('description', testProduct.description)
        .field('price', testProduct.price)
        .field('category', testProduct.category)
        .field('quantity', testProduct.quantity)
        .field('shipping', testProduct.shipping);
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/product/delete-product/:pid', () => {
    it('should delete product when logged in as admin', async () => {
      const response = await request(server)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', `${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      
      await productModel.create(testProduct);

    });

    it('should return 401 when not logged in', async () => {
      const response = await request(server)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`);
      expect(response.status).toBe(401);
    });

    it('should return 401 when logged in as regular user', async () => {
      const response = await request(server)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', `${token}`);
      expect(response.status).toBe(401);
    });

  });

  describe('POST /api/v1/product/product-filters', () => {
    beforeAll(async () => {
      
      await productModel.create([
        {
          name: 'Budget Phone',
          slug: 'budget-phone',
          description: 'Affordable smartphone',
          price: 200,
          category: testCategory._id,
          quantity: 15,
          shipping: true
        },
        {
          name: 'Premium Phone',
          slug: 'premium-phone',
          description: 'High-end smartphone',
          price: 1000,
          category: testCategory._id,
          quantity: 5,
          shipping: true
        },
        {
          name: 'Zero Price Phone',
          slug: 'zero-price-phone',
          description: 'Free phone',
          price: 0, 
          category: testCategory._id,
          quantity: 1,
          shipping: true
        },
        {
          name: 'Max Price Phone',
          slug: 'max-price-phone',
          description: 'Most expensive phone',
          price: Number.MAX_SAFE_INTEGER, 
          category: testCategory._id,
          quantity: 1,
          shipping: true
        }
      ]);
    });

    it('should filter products by price range', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          radio: [0, 500]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBeGreaterThanOrEqual(1);
      expect(response.body.products.map(product => product.name).sort()).toEqual(['Budget Phone', 'Zero Price Phone', 'Test Product'].sort());
    });

    it('should filter products by category', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          checked: [testCategory._id.toString()]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBeGreaterThanOrEqual(2);
    });

    

    it('should filter products at maximum price', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          radio: [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].name).toBe('Max Price Phone');
    });

    it('should handle negative price range', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          radio: [-100, -1]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(0);
    });

    it('should handle price range with minimum greater than maximum', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          radio: [500, 100]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(0);
    });

    it('should handle empty category array', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          checked: []
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle invalid category ID', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          checked: ['invalid-id']
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/product/product-count', () => {
    it('should return the total product count', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-count');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(typeof response.body.total).toBe('number');
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/product/product-list/:page', () => {
    
    beforeAll(async () => {
      
      const testProducts = Array.from({ length: 8 }, (_, index) => ({
        name: `Pagination Test Product ${index + 1}`,
        slug: `pagination-test-product-${index + 1}`,
        description: 'Product for pagination testing',
        price: 100 + index * 10,
        category: testCategory._id,
        quantity: 10,
        shipping: true
      }));

      await productModel.create(testProducts);
    });

    it('should return paginated product list', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-list/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
      
      expect(response.body.products.length).toBeLessThanOrEqual(6);
    });

    it('should return the second page correctly', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-list/2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
      
      expect(response.body.products.length).toBeGreaterThan(0);
    });

    it('should return error for invalid page number (negative)', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-list/-1');

      expect(response.status).toBe(400);
    });

    it('should return error for page number 0', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-list/0');

      console.log(response.body);

      expect(response.status).toBe(400);
    });

    it('should handle non-numeric page parameter', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-list/abc');

      expect(response.status).toBe(400);
    });

    it('should handle fractional page parameter', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-list/1.5');

      
      
      expect([200, 400]).toContain(response.status);
    });

    it('should return empty products array for page beyond available data', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-list/999');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBe(0);
    });
  });

  describe('GET /api/v1/product/search/:keyword', () => {
    it('should search products by keyword', async () => {
      const response = await request(server)
        .get('/api/v1/product/search/phone');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThanOrEqual(2);
    });

    it('should return error for empty keyword', async () => {
      const response = await request(server)
        .get('/api/v1/product/search/');

      expect(response.status).toBe(404);
    });

    it('should search products by exact keyword', async () => {
      const response = await request(server)
        .get('/api/v1/product/search/Max Price Phone');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(1);
      expect(response.body.results[0].name).toBe('Max Price Phone');
    });
  });

  describe('GET /api/v1/product/related-product/:pid/:cid', () => {
    it('should get related products', async () => {
      
      const newProduct = await productModel.create({
        name: 'Related Test Product',
        description: 'Another test product',
        slug: 'related-test-product',
        price: 300,
        category: testCategory._id,
        quantity: 10,
        shipping: true
      });

      const response = await request(server)
        .get(`/api/v1/product/related-product/${newProduct._id}/${testCategory._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBeGreaterThanOrEqual(1);
      expect(response.body.products.every(p => p.category._id.toString() === testCategory._id.toString())).toBe(true);
    });
  });

  describe('GET /api/v1/product/product-category/:slug', () => {
    it('should get products by category', async () => {
      const response = await request(server)
        .get(`/api/v1/product/product-category/${testCategory.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe(testCategory.name);
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-category/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/product/braintree/token', () => {
    it('should generate a braintree token', async () => {
      const response = await request(server)
        .get('/api/v1/product/braintree/token')
        .set('Authorization', `${token}`);

      expect(response.status).toBe(200);
      expect(response.body.clientToken).toBeDefined();
    });

    it('should return error when not logged in', async () => {
      const response = await request(server)
        .get('/api/v1/product/braintree/token');

      expect(response.status).toBe(401);
    });

    it('should return error when token is invalid', async () => {
      const response = await request(server)
        .get('/api/v1/product/braintree/token')
        .set('Authorization', 'invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/product/braintree/payment', () => {
    it('should process payment when logged in', async () => {
      
      const paymentProduct = await productModel.create({
        name: 'Payment Test Product',
        description: 'Product for payment testing',
        slug: 'payment-test-product',
        price: 50,
        category: testCategory._id,
        quantity: 20,
        shipping: true
      });

      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({
          nonce: 'fake-valid-nonce', 
          cart: [{
            _id: paymentProduct._id,
            name: paymentProduct.name,
            price: paymentProduct.price
          }]
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return error when not logged in', async () => {
      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .send({
          nonce: 'fake-valid-nonce',
          cart: [{ _id: 'productId', price: 50 }]
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 when nonce is missing', async () => {
      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({
          cart: [{ _id: 'productId', price: 50 }]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Payment method nonce is required');
    });

    it('should return 400 when cart is missing', async () => {
      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({
          nonce: 'fake-valid-nonce'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cart items are required');
    });

    it('should return 400 when cart is empty', async () => {
      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({
          nonce: 'fake-valid-nonce',
          cart: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cart items are required');
    });

    it('should return 404 when product does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({
          nonce: 'fake-valid-nonce',
          cart: [{
            _id: nonExistentId,
            name: 'Non-existent Product',
            price: 50
          }]
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });

    it('should handle cart with invalid format', async () => {
      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({
          nonce: 'fake-valid-nonce',
          cart: "invalid-cart-format"
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Product Uniqueness Constraints', () => {
    let uniqueProduct;

    beforeAll(async () => {
      
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Unique Product')
        .field('description', 'Unique Description')
        .field('price', '299')
        .field('category', testCategory._id.toString())
        .field('quantity', '5')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      uniqueProduct = response.body.products;
      expect(response.status).toBe(201);
    });

    it('should reject product with same name, description and price', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Unique Product') 
        .field('description', 'Unique Description') 
        .field('price', '299') 
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'false')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product already exists');
    });

    it('should accept product with same name and description but different price', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Unique Product') 
        .field('description', 'Unique Description') 
        .field('price', '399') 
        .field('category', testCategory._id.toString())
        .field('quantity', '5')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should accept product with same name and price but different description', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Unique Product') 
        .field('description', 'Different Description') 
        .field('price', '299') 
        .field('category', testCategory._id.toString())
        .field('quantity', '5')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should accept product with same description and price but different name', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Different Product') 
        .field('description', 'Unique Description') 
        .field('price', '299') 
        .field('category', testCategory._id.toString())
        .field('quantity', '5')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject updated product that matches existing name, description and price', async () => {
      
      const createResponse = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Product To Update')
        .field('description', 'This will be updated')
        .field('price', '199')
        .field('category', testCategory._id.toString())
        .field('quantity', '5')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(createResponse.status).toBe(201);

      
      const updateResponse = await request(server)
        .put(`/api/v1/product/update-product/${createResponse.body.products._id}`)
        .set('Authorization', `${adminToken}`)
        .field('name', 'Unique Product')
        .field('description', 'Unique Description')
        .field('price', '299')
        .field('category', testCategory._id.toString())
        .field('quantity', '5')
        .field('shipping', 'true');

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.success).toBe(false);
      expect(updateResponse.body.message).toContain('Product already exists');
    });
  });
});

describe('Additional Product API Tests', () => {
  describe('POST /api/v1/product/create-product', () => {
    it('should reject product with invalid price format', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Invalid Price Product')
        .field('description', 'Test Description')
        .field('price', 'not-a-number')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
    });

    it('should reject product with negative price', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Negative Price Product')
        .field('description', 'Test Description')
        .field('price', '-100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
    });

    it('should reject product with negative quantity', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Negative Quantity Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '-10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
    });

    it('should accept product with zero price', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Free Product')
        .field('description', 'Test Description')
        .field('price', '0')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject product without name', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name is Required');
    });

    it('should reject product without description', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Test Product')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Description is Required');
    });

    it('should reject product without category', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Category is Required');
    });

    it('should reject product without quantity', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Quantity is Required');
    });

    it('should reject product with non-numeric quantity', async () => {
      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Invalid Quantity Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', 'not-a-number')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
    });
  });

  describe('GET /api/v1/product/product-list/:page', () => {
    it('should handle page parameter as a floating point number', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-list/1.5');

      
      if (response.status === 200) {
        expect(response.body.products.length).toBeLessThanOrEqual(6);
      } else {
        expect(response.status).toBe(400);
      }
    });

    it('should handle extremely large page number gracefully', async () => {
      const response = await request(server)
        .get(`/api/v1/product/product-list/${Number.MAX_SAFE_INTEGER}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(0);
    });
  });

  describe('GET /api/v1/product/search/:keyword', () => {
    it('should return empty results for non-matching search term', async () => {
      const response = await request(server)
        .get('/api/v1/product/search/nonexistentproductxyz123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(0);
    });

    it('should search with case insensitivity', async () => {
      
      const lowerResponse = await request(server)
        .get('/api/v1/product/search/phone');

      
      const upperResponse = await request(server)
        .get('/api/v1/product/search/PHONE');

      expect(lowerResponse.status).toBe(200);
      expect(upperResponse.status).toBe(200);
      
      expect(upperResponse.body.results.length).toBeGreaterThan(0);
      expect(lowerResponse.body.results.length).toBeGreaterThan(0);
    });

    it('should search with special characters correctly', async () => {
      const response = await request(server)
        .get('/api/v1/product/search/product%20with%20space');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/product/braintree/payment', () => {
    it('should return 400 for malformed cart data', async () => {
      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({
          nonce: 'fake-valid-nonce',
          cart: "not-an-array"
        });

      expect(response.status).toBe(400);
    });

    it('should return error for invalid product ID in cart', async () => {
      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({
          nonce: 'fake-valid-nonce',
          cart: [{
            _id: 'invalid-id-format',
            name: 'Invalid Product',
            price: 50
          }]
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/product/get-product/:slug', () => {
    it('should handle special characters in slug', async () => {
      
      const specialProduct = await productModel.create({
        name: 'Special & Product',
        slug: 'special-product',
        description: 'Product with special characters in name',
        price: 150,
        category: testCategory._id,
        quantity: 5,
        shipping: true
      });

      const response = await request(server)
        .get(`/api/v1/product/get-product/${specialProduct.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe('Special & Product');
    });
  });
});

describe('Product Edge Cases and Additional Coverage', () => {
  describe('PUT /api/v1/product/update-product/:pid', () => {
    let productToUpdate;

    beforeEach(async () => {
      
      productToUpdate = await productModel.create({
        name: 'Product For Updating',
        slug: 'product-for-updating',
        description: 'Original description',
        price: 200,
        category: testCategory._id,
        quantity: 15,
        shipping: true
      });
    });

    it('should update product with zero price', async () => {
      const response = await request(server)
        .put(`/api/v1/product/update-product/${productToUpdate._id}`)
        .set('Authorization', `${adminToken}`)
        .field('name', 'Updated Zero Price Product')
        .field('description', 'Updated Description')
        .field('price', '0')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.products.price).toBe(0);
    });

    it('should update product with zero quantity', async () => {
      const response = await request(server)
        .put(`/api/v1/product/update-product/${productToUpdate._id}`)
        .set('Authorization', `${adminToken}`)
        .field('name', 'Updated Zero Quantity Product')
        .field('description', 'Updated Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '0')
        .field('shipping', 'true');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.products.quantity).toBe(0);
    });

    it('should reject update with negative price', async () => {
      const response = await request(server)
        .put(`/api/v1/product/update-product/${productToUpdate._id}`)
        .set('Authorization', `${adminToken}`)
        .field('name', 'Negative Price Product')
        .field('description', 'Updated Description')
        .field('price', '-50')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Price must be a non-negative number');
    });

    it('should reject update with negative quantity', async () => {
      const response = await request(server)
        .put(`/api/v1/product/update-product/${productToUpdate._id}`)
        .set('Authorization', `${adminToken}`)
        .field('name', 'Negative Quantity Product')
        .field('description', 'Updated Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '-5')
        .field('shipping', 'true');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Quantity must be a non-negative number');
    });

    it('should return 404 for non-existent product ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(server)
        .put(`/api/v1/product/update-product/${fakeId._id}`)
        .set('Authorization', `${adminToken}`)
        .field('name', 'Non-existent Product')
        .field('description', 'Updated Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/product/product-filters', () => {
    it('should handle empty arrays for both checked and radio', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          checked: [],
          radio: []
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should handle malformed filter data', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          checked: 'not-an-array',
          radio: 'also-not-an-array'
        });

      expect(response.status).toBe(400);
    });

    it('should handle invalid category IDs in checked array', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .send({
          checked: ['not-a-valid-id'],
          radio: [0, 1000]
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/product/related-product/:pid/:cid', () => {
    it('should handle non-existent product ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(server)
        .get(`/api/v1/product/related-product/${fakeId}/${testCategory._id}`);

      expect(response.status).toBe(404);
    });

    it('should handle non-existent category ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const product = await productModel.findOne();

      const response = await request(server)
        .get(`/api/v1/product/related-product/${product._id}/${fakeId}`);

      expect(response.status).toBe(404);
    });

    it('should handle invalid product ID format', async () => {
      const response = await request(server)
        .get(`/api/v1/product/related-product/invalid-id/${testCategory._id}`);

      expect(response.status).toBe(400);
    });

    it('should handle invalid category ID format', async () => {
      const product = await productModel.findOne();

      const response = await request(server)
        .get(`/api/v1/product/related-product/${product._id}/invalid-id`);

      expect(response.status).toBe(400);
    });
  });
});

describe('Additional Edge Cases and Error Handling', () => {
  describe('Token Authentication', () => {
    it('should reject requests with invalid token format', async () => {
      const response = await request(server)
        .get('/api/v1/product/braintree/token')
        .set('Authorization', 'invalid-token-format');

      expect(response.status).toBe(401);
    });

    it('should reject requests with expired token', async () => {
      
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';

      const response = await request(server)
        .get('/api/v1/product/braintree/token')
        .set('Authorization', expiredToken);

      expect(response.status).toBe(401);
    });
  });

  describe('Invalid MongoDB IDs', () => {
    it('should return 400 for invalid product ID format', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-photo/invalid-id');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid product ID in update request', async () => {
      const response = await request(server)
        .put('/api/v1/product/update-product/invalid-id')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Test Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', testCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'true');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid product ID in delete request', async () => {
      const response = await request(server)
        .delete('/api/v1/product/delete-product/invalid-id')
        .set('Authorization', `${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Malformed Request Bodies', () => {
    it('should handle malformed JSON in product filters', async () => {
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .set('Content-Type', 'application/json')
        .send('{"radio": [0, 500]'); 

      expect(response.status).toBe(400);
    });

    it('should handle empty request body in payment endpoint', async () => {
      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Category-related Edge Cases', () => {
    it('should handle non-existent category in create product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(server)
        .post('/api/v1/product/create-product')
        .set('Authorization', `${adminToken}`)
        .field('name', 'Invalid Category Product')
        .field('description', 'Test Description')
        .field('price', '100')
        .field('category', nonExistentId.toString())
        .field('quantity', '10')
        .field('shipping', 'true')
        .attach('photo', path.resolve(__dirname, '../fixtures/test-image.jpg'));

      expect(response.status).toBe(400);
    });

    it('should handle non-existent category slug in product-category endpoint', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-category/non-existent-category-xyz');

      expect(response.status).toBe(404);
    });
  });

  describe('Search Functionality Edge Cases', () => {
    it('should handle search with very long keyword', async () => {
      const longKeyword = 'a'.repeat(500); 

      const response = await request(server)
        .get(`/api/v1/product/search/${longKeyword}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(0);
    });

    it('should handle search with SQL injection attempt', async () => {
      const maliciousKeyword = "product' OR 1=1--";

      const response = await request(server)
        .get(`/api/v1/product/search/${maliciousKeyword}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Braintree Payment Edge Cases', () => {

    it('should handle payment with zero-priced items', async () => {
      
      const zeroProduct = await productModel.create({
        name: 'Free Product',
        slug: 'free-product',
        description: 'Zero price product',
        price: 0,
        category: testCategory._id,
        quantity: 10,
        shipping: false
      });

      const response = await request(server)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', `${token}`)
        .send({
          nonce: 'fake-valid-nonce',
          cart: [{
            _id: zeroProduct._id,
            name: zeroProduct.name,
            price: zeroProduct.price
          }]
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should handle very large skip values gracefully', async () => {
      
      const response = await request(server)
        .get('/api/v1/product/product-list/1000000');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(0); 
    });

    it('should handle string with numeric characters as page parameter', async () => {
      const response = await request(server)
        .get('/api/v1/product/product-list/1abc');

      expect(response.status).toBe(400);
    });
  });

  describe('Content Type Handling', () => {
    it('should handle missing content type header', async () => {
      
      const response = await request(server)
        .post('/api/v1/product/product-filters')
        .set('Content-Type', '') 
        .send(JSON.stringify({ radio: [0, 500] }));

      
      expect([200, 400, 415]).toContain(response.status);
    });
  });
});