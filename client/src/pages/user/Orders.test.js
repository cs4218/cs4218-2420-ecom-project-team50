import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import moment from 'moment';
import Orders from './Orders';

// Mocking axios
jest.mock('axios');

// Mock moment.js
jest.mock('moment', () => ({
  __esModule: true,
  default: jest.fn(date => ({
    fromNow: () => 'a few seconds ago'
  }))
}));

// Mock the auth context
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn()
}));

// Mock UserMenu component
jest.mock('../../components/UserMenu', () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

// Mock Layout component
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout">
        <h1 data-testid="layout-title">{title}</h1>
        {children}
      </div>
    );
  };
});

// Setup window.matchMedia for testing
window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};

describe('Orders Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders orders page with title', () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    
    axios.get.mockResolvedValueOnce({
      data: { orders: [] }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('All Orders')).toBeInTheDocument();
    expect(screen.getByTestId('layout-title')).toHaveTextContent('Your Orders');
  });

  it('fetches and displays orders when user is authenticated', async () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    
    const mockOrders = [
      {
        _id: '1',
        status: 'Processing',
        buyer: { name: 'John Doe' },
        createdAt: new Date().toISOString(),
        payment: { success: true },
        products: [
          { 
            _id: 'p1', 
            name: 'Product 1', 
            description: 'Description for product 1', 
            price: 99.99 
          }
        ]
      }
    ];

    axios.get.mockResolvedValueOnce({
      data: { orders: mockOrders }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
    });

    await waitFor(() => {
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Price : 99.99')).toBeInTheDocument();
    });

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(mockOrders[0].products.length);
    expect(images[0]).toHaveAttribute('src', '/api/v1/product/product-photo/p1');
  });

  it('does not fetch orders when user is not authenticated', async () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{}, jest.fn()]); // No token
    
    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });

    expect(screen.getByText('All Orders')).toBeInTheDocument();
  });

  it('handles empty orders array', async () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    
    axios.get.mockResolvedValueOnce({
      data: { orders: [] }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(screen.getByText('All Orders')).toBeInTheDocument();
    expect(screen.queryByText('Processing')).not.toBeInTheDocument();
  });

  it('handles response without orders data', async () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    
    axios.get.mockResolvedValueOnce({
      data: {}
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(screen.getByText('All Orders')).toBeInTheDocument();
    expect(screen.queryByText('Processing')).not.toBeInTheDocument();
  });

  it('handles error when fetching orders', async () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('displays multiple orders correctly', async () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    
    const mockOrders = [
      {
        _id: '1',
        status: 'Processing',
        buyer: { name: 'John Doe' },
        createdAt: new Date().toISOString(),
        payment: { success: true },
        products: [
          { _id: 'p1', name: 'Product 1', description: 'Description 1', price: 99.99 }
        ]
      },
      {
        _id: '2',
        status: 'Shipped',
        buyer: { name: 'Jane Smith' },
        createdAt: new Date().toISOString(),
        payment: { success: true },
        products: [
          { _id: 'p2', name: 'Product 2', description: 'Description 2', price: 49.99 }
        ]
      }
    ];

    axios.get.mockResolvedValueOnce({
      data: { orders: mockOrders }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Check that order numbers are displayed correctly
    const orderNumbers = screen.getAllByRole('cell', { name: /^[0-9]+$/ });
    expect(orderNumbers[0]).toHaveTextContent('1');
    expect(orderNumbers[orderNumbers.length - 2]).toHaveTextContent('2'); // Adjusted for table structure
  });

  it('handles orders with failed payments', async () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    
    const mockOrders = [
      {
        _id: '1',
        status: 'Cancelled',
        buyer: { name: 'John Doe' },
        createdAt: new Date().toISOString(),
        payment: { success: false },
        products: [
          { 
            _id: 'p1', 
            name: 'Product 1', 
            description: 'Description', 
            price: 99.99 
          }
        ]
      }
    ];

    axios.get.mockResolvedValueOnce({
      data: { orders: mockOrders }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  it('uses moment.js to format dates correctly', async () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    
    const mockOrders = [
      {
        _id: '1',
        status: 'Processing',
        buyer: { name: 'John Doe' },
        createdAt: '2023-01-01T00:00:00.000Z', // Specific date for testing
        payment: { success: true },
        products: []
      }
    ];

    axios.get.mockResolvedValueOnce({
      data: { orders: mockOrders }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(moment).toHaveBeenCalledWith('2023-01-01T00:00:00.000Z');
      expect(screen.getByText('a few seconds ago')).toBeInTheDocument();
    });
  });

  it('handles missing or incomplete order data gracefully', async () => {
    const { useAuth } = require('../../context/auth');
    useAuth.mockReturnValue([{ token: 'test-token' }, jest.fn()]);
    
    const mockOrders = [
      {
        _id: '1',
        // Missing status
        buyer: {}, // Empty buyer
        // Missing createdAt
        // Missing payment
        products: [] // Empty products
      }
    ];

    axios.get.mockResolvedValueOnce({
      data: { orders: mockOrders }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    // Component should render without crashing
    expect(screen.getByText('All Orders')).toBeInTheDocument();
    
    // Check that the component handles undefined values gracefully
    await waitFor(() => {
      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBeGreaterThan(0);
    });
  });
});