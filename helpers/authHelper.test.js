import { jest } from '@jest/globals';

// Mock bcrypt before importing the functions that use it
await jest.unstable_mockModule('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

const { default: bcrypt } = await import('bcrypt');
const { hashPassword, comparePassword } = await import('./authHelper.js');

describe('Password Utility Functions', () => {
  // Clear all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    // Original tests
    it('should hash the password successfully', async () => {
      const password = 'myPassword123';
      const fakeHashedPassword = 'fakeHashedPassword';
      bcrypt.hash.mockResolvedValue(fakeHashedPassword);
      
      const result = await hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(fakeHashedPassword);
    });

    it('should handle errors thrown by bcrypt.hash', async () => {
      const password = 'myPassword123';
      const error = new Error('Hash error');
      bcrypt.hash.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await hashPassword(password);
      
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
      consoleSpy.mockRestore();
    });

    // Boundary Value Analysis Tests
    it('should handle empty string passwords', async () => {
      const password = '';
      const fakeHashedPassword = 'emptyPasswordHash';
      bcrypt.hash.mockResolvedValue(fakeHashedPassword);
      
      const result = await hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(fakeHashedPassword);
    });

    it('should handle very long passwords (at upper boundary)', async () => {
      // Using a 72-byte password which is bcrypt's practical limit
      const password = 'a'.repeat(72);
      const fakeHashedPassword = 'veryLongPasswordHash';
      bcrypt.hash.mockResolvedValue(fakeHashedPassword);
      
      const result = await hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(fakeHashedPassword);
    });

    it('should handle passwords exceeding bcrypt limit (beyond boundary)', async () => {
      // Password exceeding 72 bytes
      const password = 'a'.repeat(100);
      const fakeHashedPassword = 'truncatedPasswordHash';
      bcrypt.hash.mockResolvedValue(fakeHashedPassword);
      
      const result = await hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(fakeHashedPassword);
    });

    // Equivalence Class Partitioning Tests
    it('should handle numeric-only passwords', async () => {
      const password = '12345678';
      const fakeHashedPassword = 'numericPasswordHash';
      bcrypt.hash.mockResolvedValue(fakeHashedPassword);
      
      const result = await hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(fakeHashedPassword);
    });

    it('should handle alphabetic-only passwords', async () => {
      const password = 'abcdefgh';
      const fakeHashedPassword = 'alphabeticPasswordHash';
      bcrypt.hash.mockResolvedValue(fakeHashedPassword);
      
      const result = await hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(fakeHashedPassword);
    });

    it('should handle passwords with special characters', async () => {
      const password = 'Pass@#$%^&!';
      const fakeHashedPassword = 'specialCharsPasswordHash';
      bcrypt.hash.mockResolvedValue(fakeHashedPassword);
      
      const result = await hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(fakeHashedPassword);
    });

    it('should handle non-string inputs', async () => {
      const password = 12345; // Number instead of string
      const fakeHashedPassword = 'nonStringPasswordHash';
      bcrypt.hash.mockResolvedValue(fakeHashedPassword);
      
      const result = await hashPassword(password);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(fakeHashedPassword);
    });

    it('should handle null or undefined passwords', async () => {
      const password = null;
      const error = new TypeError('Cannot hash null/undefined');
      bcrypt.hash.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await hashPassword(password);
      
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  describe('comparePassword', () => {
    it('should return true if passwords match', async () => {
      const password = 'myPassword123';
      const fakeHashedPassword = 'fakeHashedPassword';
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await comparePassword(password, fakeHashedPassword);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, fakeHashedPassword);
      expect(result).toBe(true);
    });

    it('should return false if passwords do not match', async () => {
      const password = 'myPassword123';
      const fakeHashedPassword = 'fakeHashedPassword';
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await comparePassword(password, fakeHashedPassword);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, fakeHashedPassword);
      expect(result).toBe(false);
    });

    // Boundary Value Analysis Tests
    it('should handle empty string passwords in comparison', async () => {
      const password = '';
      const fakeHashedPassword = 'someHashedPassword';
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await comparePassword(password, fakeHashedPassword);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, fakeHashedPassword);
      expect(result).toBe(false);
    });

    it('should handle very long passwords in comparison (at boundary)', async () => {
      const password = 'a'.repeat(72);
      const fakeHashedPassword = 'someHashedPassword';
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await comparePassword(password, fakeHashedPassword);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, fakeHashedPassword);
      expect(result).toBe(true);
    });

    it('should handle passwords exceeding bcrypt limit in comparison (beyond boundary)', async () => {
      const password = 'a'.repeat(100);
      const fakeHashedPassword = 'someHashedPassword';
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await comparePassword(password, fakeHashedPassword);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, fakeHashedPassword);
      expect(result).toBe(false);
    });

    // Equivalence Class Partitioning Tests
    it('should handle empty hashedPassword in comparison', async () => {
      const password = 'somePassword';
      const fakeHashedPassword = '';
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await comparePassword(password, fakeHashedPassword);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, fakeHashedPassword);
      expect(result).toBe(false);
    });

    it('should handle non-string inputs in comparison', async () => {
      const password = 12345; // Number instead of string
      const fakeHashedPassword = 'someHashedPassword';
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await comparePassword(password, fakeHashedPassword);
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, fakeHashedPassword);
      expect(result).toBe(false);
    });

    it('should handle null or undefined passwords in comparison', async () => {
      const password = null;
      const fakeHashedPassword = 'someHashedPassword';
      const error = new TypeError('Cannot compare null/undefined');
      bcrypt.compare.mockRejectedValue(error);
      
      // comparePassword doesn't have error handling, so it should reject
      await expect(comparePassword(password, fakeHashedPassword)).rejects.toThrow(error);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, fakeHashedPassword);
    });

    it('should handle null or undefined hashedPassword in comparison', async () => {
      const password = 'somePassword';
      const fakeHashedPassword = null;
      const error = new TypeError('Cannot compare with null/undefined hash');
      bcrypt.compare.mockRejectedValue(error);
      
      // comparePassword doesn't have error handling, so it should reject
      await expect(comparePassword(password, fakeHashedPassword)).rejects.toThrow(error);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, fakeHashedPassword);
    });
  });
});