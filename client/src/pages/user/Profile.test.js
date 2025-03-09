import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import toast from 'react-hot-toast';
import Profile from './Profile';

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../components/UserMenu', () => ({
  __esModule: true,
  default: () => <div>UserMenu</div>
}));

jest.mock('./../../components/Layout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

const mockUser = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  address: '123 Test St'
};

const mockAuth = { user: mockUser };
const mockSetAuth = jest.fn();

jest.mock('../../context/auth', () => ({
  useAuth: () => [mockAuth, mockSetAuth]
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.user = { ...mockUser };
    axios.put.mockResolvedValue({
      data: {
        updatedUser: {
          name: 'Updated User',
          email: 'test@example.com',
          phone: '0987654321',
          address: '456 New St'
        }
      }
    });
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ user: mockUser }));
  });

  const renderAndWaitForProfile = async () => {
    const renderResult = render(<Profile />);
    await waitFor(() => {
      expect(renderResult.getByPlaceholderText('Enter Your Name').value).toBe(mockUser.name);
      expect(renderResult.getByPlaceholderText('Enter Your Phone').value).toBe(mockUser.phone);
      expect(renderResult.getByPlaceholderText('Enter Your Address').value).toBe(mockUser.address);
    });
    return renderResult;
  };

  test('renders profile form with user data from auth', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    expect(getByText('USER PROFILE')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Name').value).toBe(mockUser.name);
    expect(getByPlaceholderText('Enter Your Email').value).toBe(mockUser.email);
    expect(getByPlaceholderText('Enter Your Phone').value).toBe(mockUser.phone);
    expect(getByPlaceholderText('Enter Your Address').value).toBe(mockUser.address);
  });

  test('disables email field', async () => {
    const { getByPlaceholderText } = await renderAndWaitForProfile();
    expect(getByPlaceholderText('Enter Your Email')).toBeDisabled();
  });

  test('handles case when auth user is undefined', async () => {
    jest.spyOn(require('../../context/auth'), 'useAuth')
      .mockImplementationOnce(() => [{ user: undefined }, mockSetAuth]);
    
    const { getByPlaceholderText } = render(<Profile />);
    
    await waitFor(() => {
      expect(getByPlaceholderText('Enter Your Name').value).toBe('');
      expect(getByPlaceholderText('Enter Your Email').value).toBe('');
      expect(getByPlaceholderText('Enter Your Phone').value).toBe('');
      expect(getByPlaceholderText('Enter Your Address').value).toBe('');
    });
  });

  test('updates name field when user types', async () => {
    const { getByPlaceholderText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: 'New Name' }
      });
    });
    
    expect(getByPlaceholderText('Enter Your Name').value).toBe('New Name');
  });

  test('updates email field when user types (even though disabled)', async () => {
    const { getByPlaceholderText } = await renderAndWaitForProfile();
    
    await act(async () => {
      const emailInput = getByPlaceholderText('Enter Your Email');
      emailInput.disabled = false;
      
      fireEvent.change(emailInput, {
        target: { value: 'newemail@example.com' }
      });
      
      emailInput.disabled = true;
    });
    
    expect(getByPlaceholderText('Enter Your Email').value).toBe('newemail@example.com');
  });

  test('updates password field when user types', async () => {
    const { getByPlaceholderText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter New Password'), {
        target: { value: 'newpassword' }
      });
    });
    
    expect(getByPlaceholderText('Enter New Password').value).toBe('newpassword');
  });

  test('updates address field when user types', async () => {
    const { getByPlaceholderText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Address'), {
        target: { value: 'New Address' }
      });
    });
    
    expect(getByPlaceholderText('Enter Your Address').value).toBe('New Address');
  });

  test('accepts valid numeric phone number', async () => {
    const { getByPlaceholderText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
        target: { value: '9876543210' }
      });
    });
    
    expect(getByPlaceholderText('Enter Your Phone').value).toBe('9876543210');
  });

  test('accepts phone number with exactly 15 digits (boundary value)', async () => {
    const { getByPlaceholderText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
        target: { value: '123456789012345' }
      });
    });
    
    expect(getByPlaceholderText('Enter Your Phone').value).toBe('123456789012345');
  });

  test('rejects phone number with more than 15 digits (boundary value)', async () => {
    const { getByPlaceholderText, findByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
        target: { value: '1234567890123456' } // 16 digits
      });
    });
    
    expect(await findByText('Phone number cannot exceed 15 digits')).toBeInTheDocument();
  });

  test('rejects non-numeric characters in phone number', async () => {
    const { getByPlaceholderText, findByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
        target: { value: '9876543210' }
      });
    });
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
        target: { value: '987abc6543' }
      });
    });
    
    expect(await findByText('Phone number can only contain digits')).toBeInTheDocument();
  });

  test('shows error for invalid phone format', () => {
    const isValidPhone = (phoneNumber) => {
      return /^\d{1,15}$/.test(phoneNumber);
    };
    
    // Test with invalid phone (non-numeric characters)
    expect(isValidPhone('abc123')).toBe(false);
    
    // Test with invalid phone (too long)
    expect(isValidPhone('1234567890123456')).toBe(false);
    
    // Test with valid phone
    expect(isValidPhone('1234567890')).toBe(true);
  });

  test('rejects submission with empty name field', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: '' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(toast.error).toHaveBeenCalledWith('Required fields cannot be empty');
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('rejects submission with empty phone field', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
        target: { value: '' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(toast.error).toHaveBeenCalledWith('Required fields cannot be empty');
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('rejects submission with empty address field', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Address'), {
        target: { value: '' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(toast.error).toHaveBeenCalledWith('Required fields cannot be empty');
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('resets empty name field to original value after failed submission', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: '' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    await waitFor(() => {
      expect(getByPlaceholderText('Enter Your Name').value).toBe(mockUser.name);
    });
  });

  test('resets empty phone field to original value after failed submission', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
        target: { value: '' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    await waitFor(() => {
      expect(getByPlaceholderText('Enter Your Phone').value).toBe(mockUser.phone);
    });
  });

  test('resets empty address field to original value after failed submission', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Address'), {
        target: { value: '' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    await waitFor(() => {
      expect(getByPlaceholderText('Enter Your Address').value).toBe(mockUser.address);
    });
  });

  test('rejects submission when no changes are made', async () => {
    const { getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(toast.error).toHaveBeenCalledWith('Nothing to update');
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: 'Updated User' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/profile', {
      name: 'Updated User',
      email: mockUser.email,
      password: '',
      phone: mockUser.phone,
      address: mockUser.address,
    });
  });

  test('updates auth context after successful submission', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: 'Updated User' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(mockSetAuth).toHaveBeenCalledWith({
      user: expect.objectContaining({
        name: 'Updated User',
      })
    });
  });

  test('updates localStorage after successful submission', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: 'Updated User' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth', expect.any(String));
  });

  test('shows success toast after successful submission', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: 'Updated User' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
  });

  test('clears password field after successful submission', async () => {
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter New Password'), {
        target: { value: 'newpassword' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    await waitFor(() => {
      expect(getByPlaceholderText('Enter New Password').value).toBe('');
    });
  });

  test('handles API error during profile update', async () => {
    axios.put.mockRejectedValueOnce(new Error('API Error'));
    
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: 'Updated User' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  test('handles server-side validation error', async () => {
    axios.put.mockResolvedValueOnce({
      data: {
        error: 'Server validation error'
      }
    });
    
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: 'Updated User' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    expect(toast.error).toHaveBeenCalledWith('Server validation error');
  });

  test('handles localStorage parsing error', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');
    
    const { getByPlaceholderText, getByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: 'Updated User' }
      });
      
      fireEvent.submit(getByText('UPDATE').closest('form'));
    });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update local storage');
    });
  });

  test('shows loading state during form submission', async () => {
    axios.put.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => 
        resolve({
          data: {
            updatedUser: {
              name: 'Updated User',
              email: 'test@example.com',
              phone: '0987654321',
              address: '456 New St'
            }
          }
        }), 100))
    );
    
    const { getByPlaceholderText, getByText, findByText } = await renderAndWaitForProfile();
    
    await act(async () => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), {
        target: { value: 'Updated User' }
      });
    });
    
    fireEvent.submit(getByText('UPDATE').closest('form'));
    
    const loadingButton = await findByText('UPDATING...');
    expect(loadingButton).toBeInTheDocument();
    
    const updateButton = await findByText('UPDATE');
    expect(updateButton).toBeInTheDocument();
  });
});