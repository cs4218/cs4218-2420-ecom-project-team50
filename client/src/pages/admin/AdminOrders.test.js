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
});