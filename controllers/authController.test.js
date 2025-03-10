// Mock dependencies
jest.mock('../models/userModel', () => {
    return {
      __esModule: true,
      default: jest.fn()
    };
  });
  
  jest.mock('../models/orderModel', () => {
    return {
      __esModule: true,
      default: jest.fn()
    };
  });
  
  jest.mock('./../helpers/authHelper', () => ({
    hashPassword: jest.fn().mockImplementation(password => `hashed-${password}`),
    comparePassword: jest.fn()
  }));
  
  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockImplementation(() => 'mock-token')
  }));
  
  // Import mocked dependencies
  import userModel from '../models/userModel';
  import orderModel from '../models/orderModel';
  import { hashPassword, comparePassword } from './../helpers/authHelper';
  import JWT from 'jsonwebtoken';
  
  // Import controllers
  import { 
    registerController, 
    loginController, 
    forgotPasswordController, 
    testController,
    updateProfileController,
    getOrdersController,
    getAllOrdersController,
    orderStatusController
  } from '../controllers/authController'; // Adjust path as needed
  
  describe('Auth Controllers', () => {
    // Common setup
    let req, res;
    
    beforeEach(() => {
      req = {
        body: {},
        user: { _id: 'mockUserId' },
        params: {}
      };
      
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      
      // Reset all mocks
      jest.clearAllMocks();
    });
  
    // 1. Register Controller Tests
    describe('registerController', () => {
      // Setup for register tests
      beforeEach(() => {
        req.body = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          phone: '1234567890',
          address: '123 Test St',
          answer: 'Test Answer'
        };
        
        // Mock user save
        const mockUserInstance = {
          save: jest.fn().mockResolvedValue(true)
        };
        
        userModel.mockImplementation(() => mockUserInstance);
        userModel.findOne = jest.fn().mockResolvedValue(null); // User doesn't exist by default
      });
      
      // Happy path - successful registration
      it('should register user successfully when all inputs are valid', async () => {
        await registerController(req, res);
        
        expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(hashPassword).toHaveBeenCalledWith('password123');
        expect(userModel).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'User Register Successfully'
        }));
      });
      
      // Equivalence class - missing fields (testing each required field)
      it.each([
        ['name'],
        ['email'],
        ['password'],
        ['phone no'],
        ['address'],
        ['answer']
      ])('should return 400 when %s is missing', async (field) => {
        if (field === 'phone no') {
          req.body.phone = '';
        } else {
          req.body[field] = '';
        }
        
        await registerController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: expect.stringContaining(`${field.charAt(0).toUpperCase() + field.slice(1)} is Required`)
        }));
      });
      
      // Equivalence class - existing user
      it('should return 409 when user already exists', async () => {
        userModel.findOne = jest.fn().mockResolvedValue({ _id: 'existingUserId' });
        
        await registerController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Already registered, please login'
        }));
      });
      
      // Error handling
      it('should handle unexpected errors', async () => {
        const mockError = new Error('Database error');
        userModel.findOne = jest.fn().mockRejectedValue(mockError);
        
        await registerController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Error in Registration'
        }));
      });
    });
  
    // 2. Login Controller Tests
    describe('loginController', () => {
      // Setup for login tests
      beforeEach(() => {
        req.body = {
          email: 'test@example.com',
          password: 'password123'
        };
        
        // Mock user
        const mockUser = {
          _id: 'userId123',
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed-password',
          phone: '1234567890',
          address: '123 Test St',
          role: 0
        };
        
        userModel.findOne = jest.fn().mockResolvedValue(mockUser);
        comparePassword.mockResolvedValue(true); // Password matches by default
      });
      
      // Happy path - successful login
      it('should login successfully with valid credentials', async () => {
        await loginController(req, res);
        
        expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed-password');
        expect(JWT.sign).toHaveBeenCalledWith({ _id: 'userId123' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'login successfully',
          token: 'mock-token'
        }));
      });
      
      // Equivalence class - missing fields
      it.each([
        ['email', { password: 'password123' }],
        ['password', { email: 'test@example.com' }],
        ['both email and password', {}]
      ])('should return 400 when %s is missing', async (_, credentials) => {
        req.body = credentials;
        
        await loginController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Email and password are required'
        }));
      });
      
      // Equivalence class - user not found
      it('should return 404 when user is not found', async () => {
        userModel.findOne = jest.fn().mockResolvedValue(null);
        
        await loginController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Email is not registered'
        }));
      });
      
      // Equivalence class - invalid password
      it('should return 401 when password is incorrect', async () => {
        comparePassword.mockResolvedValue(false);
        
        await loginController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Invalid Password'
        }));
      });
      
      // Error handling
      it('should handle unexpected errors', async () => {
        const mockError = new Error('Database error');
        userModel.findOne = jest.fn().mockRejectedValue(mockError);
        
        await loginController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Error in login'
        }));
      });
    });
  
    // 3. Forgot Password Controller Tests
    describe('forgotPasswordController', () => {
      beforeEach(() => {
        req.body = {
          email: 'test@example.com',
          answer: 'Test Answer',
          newPassword: 'newpassword123'
        };
        
        // Mock user
        const mockUser = {
          _id: 'userId123',
          email: 'test@example.com',
          answer: 'Test Answer'
        };
        
        userModel.findOne = jest.fn().mockResolvedValue(mockUser);
        userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
      });
      
      // Happy path - successful password reset
      it('should reset password successfully with valid inputs', async () => {
        await forgotPasswordController(req, res);
        
        expect(userModel.findOne).toHaveBeenCalledWith({ 
          email: 'test@example.com', 
          answer: 'Test Answer' 
        });
        expect(hashPassword).toHaveBeenCalledWith('newpassword123');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          'userId123', 
          { password: expect.any(String) }
        );
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Password Reset Successfully'
        }));
      });
      
      // Equivalence class - missing fields
      it.each([
        ['email', { answer: 'Test Answer', newPassword: 'newpassword123' }],
        ['answer', { email: 'test@example.com', newPassword: 'newpassword123' }],
        ['newPassword', { email: 'test@example.com', answer: 'Test Answer' }]
      ])('should return 400 when %s is missing', async (field, data) => {
        req.body = data;
        
        await forgotPasswordController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
      });
      
      // Boundary value analysis - password length
      it('should validate password length (minimum 6 characters)', async () => {
        req.body.newPassword = '12345'; // 5 characters, less than minimum
        
        await forgotPasswordController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: expect.stringContaining('at least 6 characters')
        }));
      });
      
      // Equivalence class - user not found or wrong answer
      it('should return 404 when user not found or answer incorrect', async () => {
        userModel.findOne = jest.fn().mockResolvedValue(null);
        
        await forgotPasswordController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Wrong Email Or Answer'
        }));
      });
      
      // Error handling
      it('should handle unexpected errors', async () => {
        const mockError = new Error('Database error');
        userModel.findOne = jest.fn().mockRejectedValue(mockError);
        
        await forgotPasswordController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Something went wrong'
        }));
      });
    });
  
    // 4. Test Controller Tests
    describe('testController', () => {
      it('should return success response for protected route', () => {
        testController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Protected Routes'
        }));
      });
    });
  
    // 5. Update Profile Controller Tests
    describe('updateProfileController', () => {
      beforeEach(() => {
        req.body = {
          name: 'Updated Name',
          email: 'updated@example.com',
          password: 'updatedpassword',
          phone: '9876543210',
          address: 'Updated Address'
        };
        
        // Mock user
        const mockUser = {
          _id: 'mockUserId',
          name: 'Original Name',
          email: 'original@example.com',
          password: 'hashed-original',
          phone: '1234567890',
          address: 'Original Address',
          role: 0
        };
        
        const mockUpdatedUser = {
          ...mockUser,
          ...req.body,
          password: 'hashed-updatedpassword'
        };
        
        userModel.findById = jest.fn().mockResolvedValue(mockUser);
        userModel.findOne = jest.fn().mockResolvedValue(null); // No user with that email
        userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);
      });
      
      // Happy path - successful profile update
      it('should update profile successfully with all fields', async () => {
        await updateProfileController(req, res);
        
        expect(userModel.findById).toHaveBeenCalledWith('mockUserId');
        expect(hashPassword).toHaveBeenCalledWith('updatedpassword');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          'mockUserId',
          expect.objectContaining({
            name: 'Updated Name',
            email: 'updated@example.com',
            password: expect.any(String),
            phone: '9876543210',
            address: 'Updated Address'
          }),
          { new: true }
        );
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Profile Updated Successfully'
        }));
      });
      
      // Equivalence class - partial update
      it('should handle partial update (only some fields provided)', async () => {
        req.body = { 
          name: 'Updated Name',
          // Other fields not provided
        };
        
        await updateProfileController(req, res);
        
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          'mockUserId',
          expect.objectContaining({
            name: 'Updated Name',
            // Other fields should remain unchanged
          }),
          { new: true }
        );
        
        expect(res.status).toHaveBeenCalledWith(200);
      });
      
      // Boundary value analysis - password length
      it('should validate password length (minimum 6 characters)', async () => {
        req.body.password = '12345'; // 5 characters, less than minimum
        
        await updateProfileController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: expect.stringContaining('at least 6 characters')
        }));
      });
      
      // Equivalence class - user not found
      it('should return 404 when user not found', async () => {
        userModel.findById = jest.fn().mockResolvedValue(null);
        
        await updateProfileController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'User not found'
        }));
      });
      
      // Equivalence class - email already in use
      it('should return 409 when email already in use', async () => {
        userModel.findOne = jest.fn().mockResolvedValue({ _id: 'anotherUserId' });
        
        await updateProfileController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Email already in use'
        }));
      });
      
      // Error handling
      it('should handle unexpected errors', async () => {
        const mockError = new Error('Database error');
        userModel.findById = jest.fn().mockRejectedValue(mockError);
        
        await updateProfileController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Error While Update profile'
        }));
      });
    });
  
    // 6. Get Orders Controller Tests
    describe('getOrdersController', () => {
      beforeEach(() => {
        // Mock orders
        const mockOrders = [
          { _id: 'order1', products: [], buyer: 'mockUserId' },
          { _id: 'order2', products: [], buyer: 'mockUserId' }
        ];
        
        // Setup proper method chaining for orderModel
        const mockPopulateBuyer = jest.fn().mockResolvedValue(mockOrders);
        const mockPopulateProducts = jest.fn().mockReturnValue({ populate: mockPopulateBuyer });
        const mockFind = jest.fn().mockReturnValue({ populate: mockPopulateProducts });
        
        orderModel.find = mockFind;
      });
      
      // Happy path - successfully get user orders
      it('should get user orders successfully', async () => {
        await getOrdersController(req, res);
        
        expect(orderModel.find).toHaveBeenCalledWith({ buyer: 'mockUserId' });
        expect(orderModel.find().populate).toHaveBeenCalledWith('products', '-photo');
        expect(orderModel.find().populate().populate).toHaveBeenCalledWith('buyer', 'name');
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'User Orders Fetched Successfully'
        }));
      });
      
      // Error handling
      it('should handle errors when getting orders', async () => {
        const mockError = new Error('Database error');
        orderModel.find = jest.fn().mockImplementation(() => {
          throw mockError;
        });
        
        await getOrdersController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Error While Getting Orders'
        }));
      });
    });
  
    // 7. Get All Orders Controller Tests
    describe('getAllOrdersController', () => {
      beforeEach(() => {
        // Mock orders
        const mockOrders = [
          { _id: 'order1', products: [], buyer: 'user1' },
          { _id: 'order2', products: [], buyer: 'user2' }
        ];
        
        // Setup order model mock
        orderModel.find = jest.fn().mockReturnThis();
        orderModel.find().populate = jest.fn().mockReturnThis();
        orderModel.find().populate().populate = jest.fn().mockReturnThis();
        orderModel.find().populate().populate().sort = jest.fn().mockResolvedValue(mockOrders);
      });
      
      // Happy path - successfully get all orders
      it('should get all orders successfully', async () => {
        await getAllOrdersController(req, res);
        
        expect(orderModel.find).toHaveBeenCalledWith({});
        expect(orderModel.find().populate).toHaveBeenCalledWith('products', '-photo');
        expect(orderModel.find().populate().populate).toHaveBeenCalledWith('buyer', 'name');
        expect(orderModel.find().populate().populate().sort).toHaveBeenCalledWith({ createdAt: -1 });
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'All Orders Fetched Successfully'
        }));
      });
      
      // Error handling
      it('should handle errors when getting all orders', async () => {
        const mockError = new Error('Database error');
        orderModel.find = jest.fn().mockImplementation(() => {
          throw mockError;
        });
        
        await getAllOrdersController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Error While Getting Orders'
        }));
      });
    });
  
    // 8. Order Status Controller Tests
    describe('orderStatusController', () => {
      beforeEach(() => {
        req.params = { orderId: 'order123' };
        req.body = { status: 'Processing' };
        
        // Mock order
        const mockOrder = {
          _id: 'order123',
          status: 'Not Processed'
        };
        
        const mockUpdatedOrder = {
          ...mockOrder,
          status: 'Processing'
        };
        
        orderModel.findById = jest.fn().mockResolvedValue(mockOrder);
        orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedOrder);
      });
      
      // Happy path - successfully update order status
      it('should update order status successfully', async () => {
        await orderStatusController(req, res);
        
        expect(orderModel.findById).toHaveBeenCalledWith('order123');
        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
          'order123',
          { status: 'Processing' },
          { new: true }
        );
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'Order Status Updated Successfully'
        }));
      });
      
      // Equivalence class - missing order ID
      it('should return 400 when order ID is missing', async () => {
        req.params = {};
        
        await orderStatusController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Order ID is required'
        }));
      });
      
      // Equivalence class - missing status
      it('should return 400 when status is missing', async () => {
        req.body = {};
        
        await orderStatusController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Status is required'
        }));
      });
      
      // Equivalence class - order not found
      it('should return 404 when order not found', async () => {
        orderModel.findById = jest.fn().mockResolvedValue(null);
        
        await orderStatusController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Order not found'
        }));
      });
      
      // Boundary testing - all valid status values
      it.each([
        'Not Processed',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled'
      ])('should accept valid status value: %s', async (status) => {
        req.body.status = status;
        
        await orderStatusController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(200);
      });
      
      // Error handling
      it('should handle unexpected errors', async () => {
        const mockError = new Error('Database error');
        orderModel.findById = jest.fn().mockRejectedValue(mockError);
        
        await orderStatusController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Error While Updating Order Status'
        }));
      });
    });
  });