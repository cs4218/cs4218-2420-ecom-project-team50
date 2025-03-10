import { jest } from '@jest/globals';

// Create mock functions
const mockVerify = jest.fn();

// Mock setup
beforeAll(async () => {
  // Mock jsonwebtoken with correct structure
  await jest.unstable_mockModule('jsonwebtoken', () => ({
    default: { verify: mockVerify }
  }));

  // Mock userModel
  await jest.unstable_mockModule('../models/userModel.js', () => ({
    default: {
      findById: jest.fn()
    }
  }));
});

// Dynamically import the modules and middleware
let requireSignIn, isAdmin, JWT, userModel;

beforeAll(async () => {
  const authMiddleware = await import('./authMiddleware.js');
  requireSignIn = authMiddleware.requireSignIn;
  isAdmin = authMiddleware.isAdmin;
  
  const jwtModule = await import('jsonwebtoken');
  JWT = jwtModule.default;
  
  const userModelModule = await import('../models/userModel.js');
  userModel = userModelModule.default;
});

describe("Authentication Middleware Tests", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {
        authorization: "valid-token"
      },
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = "test-secret";
  });

  describe("requireSignIn Middleware", () => {
    test("should set decoded user and call next for valid token", async () => {
      const mockDecodedUser = { _id: "123", name: "Test User" };
      mockVerify.mockReturnValue(mockDecodedUser);

      await requireSignIn(req, res, next);

      expect(mockVerify).toHaveBeenCalledWith("valid-token", "test-secret");
      expect(req.user).toBe(mockDecodedUser);
      expect(next).toHaveBeenCalled();
    });

    test("should handle JWT verification error", async () => {
      const error = new Error("Invalid token");
      mockVerify.mockImplementation(() => {
        throw error;
      });

      const consoleSpy = jest.spyOn(console, "log");
      await requireSignIn(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(next).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test("should handle missing authorization header", async () => {
      req.headers.authorization = undefined;
      const consoleSpy = jest.spyOn(console, "log");

      await requireSignIn(req, res, next);

      // Note: Current implementation doesn't check for missing header
      // and attempts to verify undefined, leading to an error
      expect(mockVerify).toHaveBeenCalledWith(undefined, "test-secret");
      expect(next).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("isAdmin Middleware", () => {
    test("should call next for admin user", async () => {
      const adminUser = { _id: "123", role: 1 };
      userModel.findById.mockResolvedValue(adminUser);
      req.user = { _id: "123" };

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith("123");
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should return 401 for non-admin user", async () => {
      const regularUser = { _id: "123", role: 0 };
      userModel.findById.mockResolvedValue(regularUser);
      req.user = { _id: "123" };

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "UnAuthorized Access"
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle database error", async () => {
      const error = new Error("Database error");
      userModel.findById.mockRejectedValue(error);
      req.user = { _id: "123" };
      const consoleSpy = jest.spyOn(console, "log");

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith("123");
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error,
        message: "Error in admin middleware"
      });
      expect(next).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test("should handle missing user ID", async () => {
      req.user = undefined;
      const consoleSpy = jest.spyOn(console, "log");

      await isAdmin(req, res, next);

      expect(userModel.findById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});