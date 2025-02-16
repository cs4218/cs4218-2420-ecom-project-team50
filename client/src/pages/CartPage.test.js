import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import toast from 'react-hot-toast';
import CartPage from './CartPage';

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../components/Layout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

jest.mock('../components/Header', () => ({
  __esModule: true,
  default: () => <div>Header</div>
}));

const mockPaymentInstance = {
  requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: 'test-nonce' })
};

jest.mock('braintree-web-drop-in-react', () => ({
  __esModule: true,
  default: function DropIn({ onInstance }) {
    onInstance(mockPaymentInstance);
    return <div data-testid="dropin-container">DropIn</div>;
  }
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const mockCart = [{
  _id: '1',
  name: 'Test Product',
  price: 100,
  description: 'Test Description'
}];

const mockAuth = {
  user: {
    name: 'Test User',
    address: '123 Test St'
  },
  token: 'fake-token'
};

const mockSetCart = jest.fn();
const mockSetAuth = jest.fn();

jest.mock('../context/auth', () => ({
  useAuth: () => [mockAuth, mockSetAuth]
}));

jest.mock('../context/cart', () => ({
  useCart: () => [mockCart, mockSetCart]
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CartPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { clientToken: 'fake-token' } });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  const renderCartPage = async () => {
    let rendered;
    await act(async () => {
      rendered = render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );
    });
    return rendered;
  };

  test('renders cart page with items', async () => {
    const { getByText } = await renderCartPage();
    expect(getByText('Cart Summary')).toBeInTheDocument();
    expect(getByText('Test Product')).toBeInTheDocument();
    expect(getByText('Price : 100')).toBeInTheDocument();
  });

  test('displays correct total price', async () => {
    const { getByText } = await renderCartPage();
    expect(getByText('Total : $100.00', { exact: true })).toBeInTheDocument();
  });

  test('handles cart total price calculation error', async () => {
    const invalidCart = [{
      _id: '1',
      name: 'Invalid Product',
      price: undefined, // Invalid price to trigger error
      description: 'Test Description'
    }];
    
    jest.spyOn(require('../context/cart'), 'useCart')
      .mockImplementation(() => [invalidCart, mockSetCart]);

    const { getByText } = await renderCartPage();
    expect(toast.error).toHaveBeenCalledWith('Error calculating total price');
    expect(getByText('Total : $0.00', { exact: true })).toBeInTheDocument();
  });

  test('handles remove item from cart', async () => {
    const { getByText } = await renderCartPage();
    
    await act(async () => {
      fireEvent.click(getByText('Remove'));
    });

    expect(mockSetCart).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('handles cart item removal error', async () => {
    mockSetCart.mockImplementationOnce(() => {
      throw new Error('Failed to remove item');
    });

    const { getByText } = await renderCartPage();
    
    await act(async () => {
      fireEvent.click(getByText('Remove'));
    });

    expect(toast.error).toHaveBeenCalledWith('Error removing item from cart');
  });

  test('handles payment token fetch error', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch token'));
    await renderCartPage();
    expect(toast.error).toHaveBeenCalledWith('Error fetching payment token');
  });

  test('handles successful payment processing', async () => {
    const { getByText } = await renderCartPage();

    await act(async () => {
      fireEvent.click(getByText('Make Payment'));
    });

    expect(mockPaymentInstance.requestPaymentMethod).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      '/api/v1/product/braintree/payment',
      expect.any(Object)
    );
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cart');
    expect(mockSetCart).toHaveBeenCalledWith([]);
    expect(toast.success).toHaveBeenCalledWith('Payment Completed Successfully ');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/orders');
  });

  test('handles payment processing error', async () => {
    mockPaymentInstance.requestPaymentMethod.mockRejectedValueOnce(new Error('Payment failed'));
    
    const { getByText } = await renderCartPage();

    await act(async () => {
      fireEvent.click(getByText('Make Payment'));
    });

    expect(toast.error).toHaveBeenCalledWith('Payment failed');
  });

  test('shows loading state during payment', async () => {
    mockPaymentInstance.requestPaymentMethod.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByText } = await renderCartPage();
    
    await act(async () => {
      fireEvent.click(getByText('Make Payment'));
    });

    await waitFor(() => {
      expect(getByText('Processing ....', { exact: true })).toBeInTheDocument();
    });
  });

  test('shows empty cart message', async () => {
    jest.spyOn(require('../context/cart'), 'useCart')
      .mockImplementation(() => [[], mockSetCart]);

    const { getByText } = await renderCartPage();
    expect(getByText('Your Cart Is Empty')).toBeInTheDocument();
  });

  test('shows login message for guest users', async () => {
    jest.spyOn(require('../context/auth'), 'useAuth')
      .mockImplementation(() => [{}, mockSetAuth]);

    const { getByText } = await renderCartPage();
    expect(getByText('Hello Guest')).toBeInTheDocument();
    expect(getByText(/please login to checkout/i)).toBeInTheDocument();
  });

  test('navigates to login page for guest checkout', async () => {
    // Mock auth with no token
    jest.spyOn(require('../context/auth'), 'useAuth')
      .mockImplementation(() => [{ user: null, token: null }, mockSetAuth]);

    const { getByText } = await renderCartPage();
    
    await act(async () => {
      fireEvent.click(getByText('Please Login to checkout'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: '/cart' });
  });

  test('navigates to profile when auth token exists but no address', async () => {
    const authWithoutAddress = {
      user: { name: 'Test User' }, // No address
      token: 'fake-token'
    };
    
    jest.spyOn(require('../context/auth'), 'useAuth')
      .mockImplementation(() => [authWithoutAddress, mockSetAuth]);
  
    const { getByText } = await renderCartPage();

    await act(async () => {
        fireEvent.click(getByText('Update Address'));
    });
  
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/profile');
  });
});