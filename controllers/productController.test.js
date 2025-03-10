import { 
  createProductController, 
  getProductController, 
  getSingleProductController,
  productPhotoController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
  brainTreePaymentController,
  braintreeTokenController,
} from '../controllers/productController'; 


jest.mock('../models/productModel', () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});

jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

jest.mock('slugify', () => jest.fn());


jest.mock('../models/categoryModel', () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});

jest.mock('braintree', () => {
  const mockClientToken = {
    generate: jest.fn()
  };
  
  const mockTransaction = {
    sale: jest.fn()
  };
  
  return {
    BraintreeGateway: jest.fn(() => ({
      clientToken: mockClientToken,
      transaction: mockTransaction
    })),
    Environment: {
      Sandbox: 'sandbox'
    }
  };
});


jest.mock('../models/orderModel', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      save: jest.fn().mockResolvedValue(true)
    }))
  };
});


import braintree from 'braintree';
import orderModel from '../models/orderModel';


import categoryModel from '../models/categoryModel';


import productModel from '../models/productModel';
import fs from 'fs';
import slugify from 'slugify';

describe('Product Controllers', () => {
  
  let req, res;
  
  beforeEach(() => {
    req = {
      fields: {},
      files: {},
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };
    
    
    jest.clearAllMocks();
  });

  
  describe('createProductController', () => {
    
    beforeEach(() => {
      req.fields = {
        name: 'Test Product',
        description: 'Test Description',
        price: '100',
        category: '60d21b4667d0d8992e610c85', 
        quantity: '10',
        shipping: 'true'
      };
      
      req.files = {
        photo: {
          size: 500000, 
          path: '/tmp/test.jpg',
          type: 'image/jpeg'
        }
      };
      
      
      const mockProductInstance = {
        save: jest.fn().mockResolvedValue(true),
        photo: { data: null, contentType: null }
      };
      
      productModel.mockImplementation(() => mockProductInstance);
      
      
      fs.readFileSync.mockReturnValue(Buffer.from('test-image'));
      
      
      slugify.mockReturnValue('test-product');
    });
    
    
    it('should create a product successfully', async () => {
      await createProductController(req, res);
      
      expect(productModel).toHaveBeenCalledWith({
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: '60d21b4667d0d8992e610c85',
        quantity: 10,
        shipping: true,
        slug: 'test-product'
      });
      
      expect(fs.readFileSync).toHaveBeenCalledWith('/tmp/test.jpg');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Product Created Successfully'
      }));
    });
    
    
    
    
    it('should return error when name is missing', async () => {
      req.fields.name = '';
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
    });
    
    
    it('should return error when description is missing', async () => {
      req.fields.description = '';
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
    });
    
    
    it('should return error when price is missing', async () => {
      req.fields.price = '';
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required' });
    });

    it('should return error when category is missing', async () => {
      req.fields.category = '';
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
    });
    
    
    it('should return error when price is negative', async () => {
      req.fields.price = '-10';
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Price must be a non-negative number' });
    });
    
    
    it('should return error when price is not a number', async () => {
      req.fields.price = 'abc';
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Price must be a non-negative number' });
    });
    
    
    it('should return error when quantity is missing', async () => {
      req.fields.quantity = '';
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required' });
    });
    
    it('should return error when quantity is negative', async () => {
      req.fields.quantity = '-5';
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Quantity must be a non-negative number' });
    });
    
    
    it('should return error when photo size exceeds limit', async () => {
      req.files.photo.size = 1500000; 
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'photo is Required and should be less then 1mb' });
    });
    
    
    it('should handle errors during product creation', async () => {
      const mockError = new Error('Database error');
      const mockProductInstance = {
        save: jest.fn().mockRejectedValue(mockError),
        photo: { data: null, contentType: null }
      };
      
      productModel.mockImplementation(() => mockProductInstance);
      
      await createProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error in creating product'
      }));
    });
  });

  describe('getProductController', () => {
    
    beforeEach(() => {
      
      const mockProducts = [
        { name: 'Product 1', price: 100 },
        { name: 'Product 2', price: 200 }
      ];
      
      const mockFind = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue(mockProducts);
      
      productModel.find = mockFind;
      productModel.find().populate = mockPopulate;
      productModel.find().populate().select = mockSelect;
      productModel.find().populate().select().limit = mockLimit;
      productModel.find().populate().select().limit().sort = mockSort;
    });
    
    
    it('should get all products successfully', async () => {
      await getProductController(req, res);
      
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(productModel.find().populate).toHaveBeenCalledWith('category');
      expect(productModel.find().populate().select).toHaveBeenCalledWith('-photo');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'All products retrieved'
      }));
    });
    
    
    it('should handle errors when getting products', async () => {
      const mockError = new Error('Database error');
      productModel.find = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      await getProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error in getting products'
      }));
    });
  });

  describe('getSingleProductController', () => {
    
    beforeEach(() => {
      req.params = { slug: 'test-product' };
      
      
      const mockProduct = { name: 'Test Product', price: 100 };
      
      const mockFindOne = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockResolvedValue(mockProduct);
      
      productModel.findOne = mockFindOne;
      productModel.findOne().select = mockSelect;
      productModel.findOne().select().populate = mockPopulate;
    });
    
    
    it('should get a single product successfully', async () => {
      await getSingleProductController(req, res);
      
      expect(productModel.findOne).toHaveBeenCalledWith({ slug: 'test-product' });
      expect(productModel.findOne().select).toHaveBeenCalledWith('-photo');
      expect(productModel.findOne().select().populate).toHaveBeenCalledWith('category');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Single Product Fetched'
      }));
    });
    
    
    it('should handle errors when getting a single product', async () => {
      const mockError = new Error('Database error');
      productModel.findOne = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      await getSingleProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error while getting single product'
      }));
    });
  });

  describe('productPhotoController', () => {
    
    beforeEach(() => {
      req.params = { pid: '60d21b4667d0d8992e610c85' };
    });
    
    
    it('should get product photo successfully', async () => {
      const photoData = Buffer.from('test-image');
      const mockProduct = {
        photo: {
          data: photoData,
          contentType: 'image/jpeg'
        }
      };
      
      productModel.findById = jest.fn().mockReturnThis();
      productModel.findById().select = jest.fn().mockResolvedValue(mockProduct);
      
      await productPhotoController(req, res);
      
      expect(productModel.findById).toHaveBeenCalledWith('60d21b4667d0d8992e610c85');
      expect(productModel.findById().select).toHaveBeenCalledWith('photo');
      
      expect(res.set).toHaveBeenCalledWith('Content-type', 'image/jpeg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(photoData);
    });
    
    
    it('should return 404 when product is not found', async () => {
      productModel.findById = jest.fn().mockReturnThis();
      productModel.findById().select = jest.fn().mockResolvedValue(null);
      
      await productPhotoController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Product not found'
      }));
    });
    
    
    it('should return 404 when product has no photo', async () => {
      const mockProduct = {
        photo: null
      };
      
      productModel.findById = jest.fn().mockReturnThis();
      productModel.findById().select = jest.fn().mockResolvedValue(mockProduct);
      
      await productPhotoController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'No photo available for this product'
      }));
    });
    
    
    it('should return 404 when product has photo object but no data', async () => {
      const mockProduct = {
        photo: {
          data: null,
          contentType: 'image/jpeg'
        }
      };
      
      productModel.findById = jest.fn().mockReturnThis();
      productModel.findById().select = jest.fn().mockResolvedValue(mockProduct);
      
      await productPhotoController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'No photo available for this product'
      }));
    });
    
    
    it('should handle errors when getting product photo', async () => {
      const mockError = new Error('Database error');
      productModel.findById = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      await productPhotoController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error while getting photo'
      }));
    });
  });

  describe('deleteProductController', () => {
    
    beforeEach(() => {
      req.params = { pid: '60d21b4667d0d8992e610c85' };
    });
    
    
    it('should delete a product successfully', async () => {
      
      const mockProduct = {
        _id: '60d21b4667d0d8992e610c85',
        name: 'Test Product'
      };
      
      productModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockProduct);
      
      await deleteProductController(req, res);
      
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('60d21b4667d0d8992e610c85');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Product Deleted successfully'
      }));
    });
    
    
    it('should return 404 when product to delete is not found', async () => {
      
      
      productModel.findByIdAndDelete = jest.fn().mockResolvedValue(null);
      
      await deleteProductController(req, res);
      
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Product not found'
      }));
    });
    
    
    it('should handle errors when deleting a product', async () => {
      const mockError = new Error('Database error');
      productModel.findByIdAndDelete = jest.fn().mockRejectedValue(mockError);
      
      await deleteProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error while deleting product'
      }));
    });
  });

  describe('updateProductController', () => {
    
    beforeEach(() => {
      req.params = { pid: '60d21b4667d0d8992e610c85' };
      
      req.fields = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: '150',
        category: '60d21b4667d0d8992e610c86',
        quantity: '15',
        shipping: false
      };
      
      req.files = {
        photo: {
          size: 600000, 
          path: '/tmp/updated.jpg',
          type: 'image/jpeg'
        }
      };
      
      
      const mockUpdatedProduct = {
        _id: '60d21b4667d0d8992e610c85',
        name: 'Updated Product',
        save: jest.fn().mockResolvedValue(true),
        photo: { data: null, contentType: null }
      };
      
      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProduct);
      
      
      fs.readFileSync.mockReturnValue(Buffer.from('updated-image'));
      
      
      slugify.mockReturnValue('updated-product');
    });
    
    
    it('should update a product successfully', async () => {
      await updateProductController(req, res);
      
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '60d21b4667d0d8992e610c85',
        {
          name: 'Updated Product',
          description: 'Updated Description',
          price: 150,
          category: '60d21b4667d0d8992e610c86',
          quantity: 15,
          shipping: false,
          slug: 'updated-product'
        },
        { new: true }
      );
      
      expect(fs.readFileSync).toHaveBeenCalledWith('/tmp/updated.jpg');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Product Updated Successfully'
      }));
    });
    
    
    it('should accept zero price and quantity', async () => {
      req.fields.price = '0';
      req.fields.quantity = '0';
      
      await updateProductController(req, res);
      
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          price: 0,
          quantity: 0
        }),
        expect.any(Object)
      );
      
      expect(res.status).toHaveBeenCalledWith(201);
    });
    
    
    it('should return error when name is missing in update', async () => {
      req.fields.name = '';
      
      await updateProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
    });

    
    it('should return error when description is missing in update', async () => {
      req.fields.description = '';
      
      await updateProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
    });

    
    it('should return error when price is missing in update', async () => {
      req.fields.price = '';
      
      await updateProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required' });
    });

    
    it('should return error when category is missing in update', async () => {
      req.fields.category = '';
      
      await updateProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
    });

    
    
    it('should return error when price is negative in update', async () => {
      req.fields.price = '-10';
      
      await updateProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Price must be a non-negative number' });
    });

    
    it('should return error when quantity is missing in update', async () => {
      req.fields.quantity = '';
      
      await updateProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required' });
    });

    
    it('should return error when quantity is negative in update', async () => {
      req.fields.quantity = '-5';
      
      await updateProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Quantity must be a non-negative number' });
    });
    
    
    it('should return error when photo size exceeds limit in update', async () => {
      req.files.photo.size = 1200000; 
      
      await updateProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'photo is Required and should be less then 1mb' });
    });
    
    
    it('should update a product without changing photo', async () => {
      req.files = {}; 
      
      await updateProductController(req, res);
      
      expect(productModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled(); 
      expect(res.status).toHaveBeenCalledWith(201);
    });
    
    
    it('should handle errors during product update', async () => {
      const mockError = new Error('Database error');
      productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);
      
      await updateProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error in updating product'
      }));
    });
  });

  describe('productFiltersController', () => {
    beforeEach(() => {
      req.body = {
        checked: ['60d21b4667d0d8992e610c85'], 
        radio: [0, 1000] 
      };
      
      
      const mockProducts = [
        { name: 'Filtered Product 1', price: 100 },
        { name: 'Filtered Product 2', price: 200 }
      ];
      
      productModel.find = jest.fn().mockReturnThis();
      productModel.find().select = jest.fn().mockResolvedValue(mockProducts);
    });
    
    
    it('should filter products by category and price range', async () => {
      await productFiltersController(req, res);
      
      
      expect(productModel.find).toHaveBeenCalledWith({
        category: ['60d21b4667d0d8992e610c85'],
        price: { $gte: 0, $lte: 1000 }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        products: expect.any(Array)
      }));
    });
    
    
    it('should filter products by category only', async () => {
      req.body = { checked: ['60d21b4667d0d8992e610c85'], radio: [] };
      
      await productFiltersController(req, res);
      
      expect(productModel.find).toHaveBeenCalledWith({
        category: ['60d21b4667d0d8992e610c85']
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    
    it('should filter products by price range only', async () => {
      req.body = { checked: [], radio: [50, 500] };
      
      await productFiltersController(req, res);
      
      expect(productModel.find).toHaveBeenCalledWith({
        price: { $gte: 50, $lte: 500 }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    
    it('should return all products when no filters are provided', async () => {
      req.body = { checked: [], radio: [] };
      
      await productFiltersController(req, res);
      
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    
    it('should handle errors when filtering products', async () => {
      const mockError = new Error('Database error');
      productModel.find = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      await productFiltersController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error while filtering products'
      }));
    });
  });
  
  describe('productCountController', () => {
    
    it('should get total product count successfully', async () => {
      productModel.countDocuments = jest.fn().mockResolvedValue(25);
      
      await productCountController(req, res);
      
      expect(productModel.countDocuments).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: 25
      });
    });
    
    
    it('should handle errors when counting products', async () => {
      const mockError = new Error('Database error');
      productModel.countDocuments = jest.fn().mockRejectedValue(mockError);
      
      await productCountController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error in product count'
      }));
    });
  });
  
  describe('productListController', () => {
    beforeEach(() => {
      
      const mockProducts = [
        { name: 'Product 1', price: 100 },
        { name: 'Product 2', price: 200 }
      ];
      
      productModel.find = jest.fn().mockReturnThis();
      productModel.find().select = jest.fn().mockReturnThis();
      productModel.find().select().skip = jest.fn().mockReturnThis();
      productModel.find().select().skip().limit = jest.fn().mockReturnThis();
      productModel.find().select().skip().limit().sort = jest.fn().mockResolvedValue(mockProducts);
    });
    
    
    it('should get products for page 1 successfully', async () => {
      req.params = { page: '1' };
      
      await productListController(req, res);
      
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(productModel.find().select).toHaveBeenCalledWith('-photo');
      expect(productModel.find().select().skip).toHaveBeenCalledWith(0); 
      expect(productModel.find().select().skip().limit).toHaveBeenCalledWith(6);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        products: expect.any(Array)
      }));
    });
    
    
    it('should get products for page 2 with correct skip value', async () => {
      req.params = { page: '2' };
      
      await productListController(req, res);
      
      expect(productModel.find().select().skip).toHaveBeenCalledWith(6); 
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    
    it('should default to page 1 when no page is specified', async () => {
      req.params = {};
      
      await productListController(req, res);
      
      expect(productModel.find().select().skip).toHaveBeenCalledWith(0);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    
    it('should return error for invalid page number', async () => {
      req.params = { page: '-1' };
      
      await productListController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Page number must be at least 1'
      }));
    });
    
    
    it('should handle errors when getting paginated products', async () => {
      req.params = { page: '1' };
      
      const mockError = new Error('Database error');
      productModel.find = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      await productListController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error in per page controller'
      }));
    });
  });
  
  describe('searchProductController', () => {
    beforeEach(() => {
      req.params = { keyword: 'test' };
      
      
      const mockResults = [
        { name: 'Test Product 1', description: 'Some description' },
        { name: 'Product 2', description: 'Test description' }
      ];
      
      productModel.find = jest.fn().mockReturnThis();
      productModel.find().select = jest.fn().mockResolvedValue(mockResults);
    });
    
    
    it('should search products by keyword successfully', async () => {
      await searchProductController(req, res);
      
      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'test', $options: 'i' } },
          { description: { $regex: 'test', $options: 'i' } }
        ]
      });
      
      expect(productModel.find().select).toHaveBeenCalledWith('-photo');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        results: expect.any(Array)
      }));
    });
    
    
    it('should return error when search keyword is empty', async () => {
      req.params = { keyword: '' };
      
      await searchProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Search keyword is required'
      }));
    });
    
    
    it('should return error when search keyword is null', async () => {
      req.params = { keyword: null };
      
      await searchProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Search keyword is required'
      }));
    });
    
    
    it('should handle errors when searching products', async () => {
      const mockError = new Error('Database error');
      productModel.find = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      await searchProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error In Search Product API'
      }));
    });
  });
  
  describe('relatedProductController', () => {
    beforeEach(() => {
      req.params = { 
        pid: '60d21b4667d0d8992e610c85', 
        cid: '60d21b4667d0d8992e610c86'  
      };
      
      
      productModel.exists = jest.fn().mockResolvedValue(true);
      categoryModel.exists = jest.fn().mockResolvedValue(true);
      
      
      const mockRelatedProducts = [
        { name: 'Related Product 1', price: 100 },
        { name: 'Related Product 2', price: 200 }
      ];
      
      productModel.find = jest.fn().mockReturnThis();
      productModel.find().select = jest.fn().mockReturnThis();
      productModel.find().select().limit = jest.fn().mockReturnThis();
      productModel.find().select().limit().populate = jest.fn().mockResolvedValue(mockRelatedProducts);
    });
    
    
    it('should get related products successfully', async () => {
      await relatedProductController(req, res);
      
      expect(productModel.exists).toHaveBeenCalledWith({ _id: '60d21b4667d0d8992e610c85' });
      expect(categoryModel.exists).toHaveBeenCalledWith({ _id: '60d21b4667d0d8992e610c86' });
      
      expect(productModel.find).toHaveBeenCalledWith({
        category: '60d21b4667d0d8992e610c86',
        _id: { $ne: '60d21b4667d0d8992e610c85' }
      });
      
      expect(productModel.find().select).toHaveBeenCalledWith('-photo');
      expect(productModel.find().select().limit).toHaveBeenCalledWith(3);
      expect(productModel.find().select().limit().populate).toHaveBeenCalledWith('category');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        products: expect.any(Array)
      }));
    });
    
    
    it('should return 404 when product not found', async () => {
      productModel.exists = jest.fn().mockResolvedValue(false);
      
      await relatedProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Product not found'
      }));
    });
    
    
    it('should return 404 when category not found', async () => {
      productModel.exists = jest.fn().mockResolvedValue(true);
      categoryModel.exists = jest.fn().mockResolvedValue(false);
      
      await relatedProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Category not found'
      }));
    });
    
    
    it('should handle errors when getting related products', async () => {
      const mockError = new Error('Database error');
      productModel.exists = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      await relatedProductController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'error while getting related products'
      }));
    });
  });
  
  describe('productCategoryController', () => {
    beforeEach(() => {
      req.params = { slug: 'test-category' };
      
      
      const mockCategory = { 
        _id: '60d21b4667d0d8992e610c86', 
        name: 'Test Category',
        slug: 'test-category'
      };
      
      
      const mockProductsInCategory = [
        { name: 'Category Product 1', price: 100 },
        { name: 'Category Product 2', price: 200 }
      ];
      
      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
      productModel.find = jest.fn().mockReturnThis();
      productModel.find().populate = jest.fn().mockResolvedValue(mockProductsInCategory);
    });
    
    
    it('should get products by category successfully', async () => {
      await productCategoryController(req, res);
      
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: 'test-category' });
      
      expect(productModel.find).toHaveBeenCalledWith({ 
        category: expect.objectContaining({ 
          _id: '60d21b4667d0d8992e610c86',
          slug: 'test-category'
        }) 
      });
      
      expect(productModel.find().populate).toHaveBeenCalledWith('category');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        category: expect.any(Object),
        products: expect.any(Array)
      }));
    });
    
    
    it('should return 404 when category not found', async () => {
      categoryModel.findOne = jest.fn().mockResolvedValue(null);
      
      await productCategoryController(req, res);
      
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: 'test-category' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Category not found'
      }));
    });
    
    
    it('should handle errors when getting products by category', async () => {
      const mockError = new Error('Database error');
      categoryModel.findOne = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      await productCategoryController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error While Getting products'
      }));
    });
  });

  describe('Braintree Payment Controllers', () => {
    
    let req, res;
    let mockClientToken, mockTransaction;
    
    beforeEach(() => {
      req = {
        body: {},
        user: { _id: 'mockUserId' }
      };
      
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      
      
      const gateway = new braintree.BraintreeGateway();
      mockClientToken = gateway.clientToken;
      mockTransaction = gateway.transaction;
      
      
      jest.clearAllMocks();
    });
    
    describe('braintreeTokenController', () => {
      
      it('should generate a braintree token successfully', async () => {
        const mockTokenResponse = { clientToken: 'mock-client-token' };
        
        
        mockClientToken.generate.mockImplementation((options, callback) => {
          callback(null, mockTokenResponse);
        });
        
        await braintreeTokenController(req, res);
        
        expect(mockClientToken.generate).toHaveBeenCalledWith({}, expect.any(Function));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(mockTokenResponse);
      });
      
      
      it('should handle errors when generating a token', async () => {
        const mockError = new Error('Token generation error');
        
        
        mockClientToken.generate.mockImplementation((options, callback) => {
          callback(mockError, null);
        });
        
        await braintreeTokenController(req, res);
        
        expect(mockClientToken.generate).toHaveBeenCalledWith({}, expect.any(Function));
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Error generating token',
          error: mockError.message
        }));
      });
      
      
      it('should catch and handle unexpected errors', async () => {
        const unexpectedError = new Error('Unexpected failure');
        
        
        mockClientToken.generate.mockImplementation(() => {
          throw unexpectedError;
        });
        
        await braintreeTokenController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Error in generating braintree token',
          error: unexpectedError.message
        }));
      });
    });
    
    describe('brainTreePaymentController', () => {
      beforeEach(() => {
        
        req.body = {
          nonce: 'valid-payment-nonce',
          cart: [
            { _id: 'product1', name: 'Product 1', price: 100 },
            { _id: 'product2', name: 'Product 2', price: 200 }
          ]
        };
        
        
        productModel.findById = jest.fn().mockImplementation((id) => {
          if (id === 'product1' || id === 'product2') {
            return Promise.resolve({
              _id: id,
              name: id === 'product1' ? 'Product 1' : 'Product 2',
              quantity: 20 
            });
          }
          return Promise.resolve(null);
        });
        
        
        mockTransaction.sale.mockImplementation((transactionRequest, callback) => {
          callback(null, { 
            success: true, 
            transaction: { id: 'mock-transaction-id' } 
          });
        });
      });
      
      
      it('should process a payment successfully', async () => {
        await brainTreePaymentController(req, res);
        
        expect(mockTransaction.sale).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: '300.00', 
            paymentMethodNonce: 'valid-payment-nonce',
            options: {
              submitForSettlement: true
            }
          }),
          expect.any(Function)
        );
        
        expect(orderModel).toHaveBeenCalledWith(expect.objectContaining({
          products: req.body.cart,
          buyer: 'mockUserId'
        }));
        
        expect(res.json).toHaveBeenCalledWith({ ok: true });
      });
      
      
      it('should return error when nonce is missing', async () => {
        req.body = {
          cart: [{ _id: 'product1', price: 100 }]
        };
        
        await brainTreePaymentController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Payment method nonce is required'
        }));
        
        expect(mockTransaction.sale).not.toHaveBeenCalled();
      });
      
      
      it('should return error when cart is missing', async () => {
        req.body = {
          nonce: 'valid-payment-nonce'
        };
        
        await brainTreePaymentController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Cart items are required'
        }));
        
        expect(mockTransaction.sale).not.toHaveBeenCalled();
      });
      
      
      it('should return error when cart is empty', async () => {
        req.body = {
          nonce: 'valid-payment-nonce',
          cart: []
        };
        
        await brainTreePaymentController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: 'Cart items are required'
        }));
        
        expect(mockTransaction.sale).not.toHaveBeenCalled();
      });
      
      
      it('should return error when product is not found', async () => {
        req.body.cart = [{ _id: 'nonexistent-product', name: 'Missing Product', price: 100 }];
        
        
        productModel.findById = jest.fn().mockResolvedValue(null);
        
        await brainTreePaymentController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          message: expect.stringContaining('Product not found')
        }));
        
        expect(mockTransaction.sale).not.toHaveBeenCalled();
      });
      
      
      it('should handle transaction failure', async () => {
        const transactionError = new Error('Transaction failed');
        
        
        mockTransaction.sale.mockImplementation((transactionRequest, callback) => {
          callback(transactionError, null);
        });
        
        await brainTreePaymentController(req, res);
        
        expect(mockTransaction.sale).toHaveBeenCalled();
        expect(orderModel).not.toHaveBeenCalled(); 
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(transactionError);
      });
      
      
      it('should handle order creation failure', async () => {
        const saveError = new Error('Order save failed');
        
        
        orderModel.mockImplementationOnce(() => ({
          save: jest.fn().mockRejectedValue(saveError)
        }));
        
        await brainTreePaymentController(req, res);
        
        expect(mockTransaction.sale).toHaveBeenCalled();
        expect(orderModel).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(saveError);
      });
      
      
      it('should catch and handle unexpected errors', async () => {
        const unexpectedError = new Error('Unexpected failure');
        
        
        productModel.findById = jest.fn().mockImplementation(() => {
          throw unexpectedError;
        });
        
        await brainTreePaymentController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(unexpectedError);
      });
    });
  });

});