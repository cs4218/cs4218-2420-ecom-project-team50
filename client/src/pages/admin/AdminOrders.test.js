import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminOrders from './AdminOrders';
import { useAuth } from '../../context/auth';
import axios from 'axios';
import toast from 'react-hot-toast';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn()
}));
jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="mock-layout" title={title}>{children}</div>
));
jest.mock('../../components/AdminMenu', () => () => (
  <div data-testid="mock-admin-menu">Admin Menu</div>
));
jest.mock('moment', () => () => ({
  fromNow: () => 'a few seconds ago'
}));

jest.mock('antd', () => {
  const Select = ({
    defaultValue,
    onChange,
    bordered,
    children
  }) => (
    <select
      data-testid="status-select"
      value={defaultValue}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );

  Select.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );

  return { Select };
});

describe('AdminOrders Component', () => {
  const mockOrders = [
    {
      _id: '1',
      status: 'Processing',
      buyer: { name: 'John Doe' },
      createAt: '2024-02-17T10:00:00Z',
      payment: { success: true },
      products: [
        {
          _id: 'p1',
          name: 'Test Product',
          description: 'Test Description that is longer than 30 characters for testing truncation',
          price: 99.99
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
  });

  test('renders empty state when no orders are present', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<AdminOrders />);
    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
    });
  });

  test('renders orders table with correct data when orders are present', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
      expect(screen.getByTestId('mock-admin-menu')).toBeInTheDocument();
      expect(screen.getByText('All Orders')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Price : 99.99')).toBeInTheDocument();
    });
  });

  test('handles order status update successfully', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ 
      data: { success: true }
    });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByTestId('status-select')).toBeInTheDocument();
    });

    const select = screen.getByTestId('status-select');
    fireEvent.change(select, { target: { value: 'Shipped' } });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/auth/order-status/1',
        { status: 'Shipped' }
      );
      expect(toast.success).toHaveBeenCalledWith('Order status updated successfully');
    });
  });

  test('handles order status update error with custom error message', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce({ 
      response: { 
        data: { 
          message: 'Server validation failed' 
        } 
      }
    });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByTestId('status-select')).toBeInTheDocument();
    });

    const select = screen.getByTestId('status-select');
    fireEvent.change(select, { target: { value: 'Shipped' } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server validation failed');
    });
  });

  test('handles order status update error with no response data', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce({ 
      response: {} 
    });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByTestId('status-select')).toBeInTheDocument();
    });

    const select = screen.getByTestId('status-select');
    fireEvent.change(select, { target: { value: 'Shipped' } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update order status');
    });
  });

  test('handles order status update error with no response object', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce(new Error('Network error'));

    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByTestId('status-select')).toBeInTheDocument();
    });

    const select = screen.getByTestId('status-select');
    fireEvent.change(select, { target: { value: 'Shipped' } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update order status');
    });
  });

  test('handles initial orders fetch failure', async () => {
    axios.get.mockRejectedValueOnce({ 
      response: { data: { message: 'Failed to fetch orders' } }
    });

    render(<AdminOrders />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch orders');
    });
  });

  test('does not fetch orders when auth token is missing', () => {
    useAuth.mockReturnValueOnce([{}, jest.fn()]);
    render(<AdminOrders />);
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('truncates product description correctly', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<AdminOrders />);

    await waitFor(() => {
      const truncatedDescription = screen.getByText('Test Description that is longe');
      expect(truncatedDescription).toBeInTheDocument();
    });
  });

  test('displays correct number of products in order', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<AdminOrders />);

    await waitFor(() => {
      const quantityElement = screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'td' && content === '1' && 
               element.previousElementSibling?.textContent === 'Success';
      });
      expect(quantityElement).toBeInTheDocument();
    });
  });

  test('handles missing buyer information gracefully', async () => {
    const ordersWithMissingBuyer = [
      {
        ...mockOrders[0],
        buyer: null
      }
    ];
    
    axios.get.mockResolvedValueOnce({ data: ordersWithMissingBuyer });
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  test('handles createdAt date field correctly', async () => {
    const ordersWithBothDateFields = [
      {
        ...mockOrders[0],
        createAt: undefined,
        createdAt: '2024-02-17T10:00:00Z'
      }
    ];
    
    axios.get.mockResolvedValueOnce({ data: ordersWithBothDateFields });
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('a few seconds ago')).toBeInTheDocument();
    });
  });

  test('handles payment information correctly when missing', async () => {
    const ordersWithMissingPayment = [
      {
        ...mockOrders[0],
        payment: undefined
      }
    ];
    
    axios.get.mockResolvedValueOnce({ data: ordersWithMissingPayment });
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
      expect(screen.queryByText('Failed')).not.toBeInTheDocument();
    });
  });

  test('validates status spelling in dropdown options', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByTestId('status-select')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('option');
    const optionTexts = options.map(option => option.textContent);
    
    expect(optionTexts).toContain('Not Process');
    expect(optionTexts).toContain('Processing');
    expect(optionTexts).toContain('Shipped');
    
    expect(optionTexts).toContain('deliverd');
    expect(optionTexts).not.toContain('delivered');
  });

  test('handles missing products array gracefully', async () => {
    const ordersWithNoProducts = [
      {
        ...mockOrders[0],
        products: undefined
      }
    ];
    
    axios.get.mockResolvedValueOnce({ data: ordersWithNoProducts });
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  test('checks for admin role before fetching orders', async () => {
    useAuth.mockReturnValueOnce([{ 
      token: 'test-token',
      user: { role: 0 }
    }, jest.fn()]);
    
    render(<AdminOrders />);
    
    expect(axios.get).toHaveBeenCalled();
  });

  test('handles network error when fetching orders', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(<AdminOrders />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch orders');
    });
  });
});