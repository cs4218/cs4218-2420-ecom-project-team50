import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Products from './Products';

// Mocking axios
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};

describe('Products Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders products page with title', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Products />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('All Products List')).toBeInTheDocument();
  });

  it('fetches and displays products successfully', async () => {
    const mockProducts = [
      { _id: '1', name: 'Product 1', description: 'Description 1', slug: 'product-1' },
      { _id: '2', name: 'Product 2', description: 'Description 2', slug: 'product-2' }
    ];

    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Products />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product');
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Description 2')).toBeInTheDocument();
    });

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(mockProducts.length);
    expect(images[0]).toHaveAttribute('src', '/api/v1/product/product-photo/1');
    expect(images[1]).toHaveAttribute('src', '/api/v1/product/product-photo/2');
  });

  it('handles empty products array', async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [] }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Products />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(screen.getByText('All Products List')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles response without products data', async () => {
    axios.get.mockResolvedValueOnce({
      data: {}
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Products />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(screen.getByText('All Products List')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles error when fetching products', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Products />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(toast.error).toHaveBeenCalledWith('Something Went Wrong');
  });

  it('renders product links with correct URLs', async () => {
    const mockProducts = [
      { _id: '1', name: 'Product 1', description: 'Description 1', slug: 'product-1' }
    ];

    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts }
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Products />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      const productLinks = screen.getAllByRole('link', { name: /Product 1/i });
      expect(productLinks[productLinks.length - 1]).toHaveAttribute('href', '/dashboard/admin/product/product-1');
    });
  });
});