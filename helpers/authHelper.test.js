import { jest } from '@jest/globals';

await jest.unstable_mockModule('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

const { default: bcrypt } = await import('bcrypt');
const { hashPassword, comparePassword } = await import('./authHelper.js'); // adjust path as needed

describe('Password Utility Functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
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
  });
});
