import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Search from './Search';

// Mock the Layout component
jest.mock('./../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="mock-layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock the useSearch hook
jest.mock('../context/search', () => ({
  useSearch: jest.fn()
}));

// Mock the product image endpoint
const mockProductPhoto = '/api/v1/product/product-photo/123';
global.fetch = jest.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob()),
  })
);

describe('Search Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders no products found message when results are empty', () => {
    const mockValues = {
      results: []
    };
    require('../context/search').useSearch.mockReturnValue([mockValues, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('No Products Found')).toBeInTheDocument();
  });

  it('renders correct number of products found', () => {
    const mockProducts = [
      {
        _id: '1',
        name: 'Test Product 1',
        description: 'Test Description 1',
        price: 99.99
      },
      {
        _id: '2',
        name: 'Test Product 2',
        description: 'Test Description 2',
        price: 149.99
      }
    ];

    const mockValues = {
      results: mockProducts
    };
    require('../context/search').useSearch.mockReturnValue([mockValues, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('Found 2')).toBeInTheDocument();
  });

  it('renders product cards with correct information', () => {
    const mockProducts = [
      {
        _id: '1',
        name: 'Test Product 1',
        description: 'This is a very long description that needs to be truncated',
        price: 99.99
      }
    ];

    const mockValues = {
      results: mockProducts
    };
    require('../context/search').useSearch.mockReturnValue([mockValues, jest.fn()]);

    render(<Search />);
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    // Get truncated description (first 30 chars + ...)
    const truncatedText = mockProducts[0].description.substring(0, 30) + '...';
    expect(screen.getByText(truncatedText)).toBeInTheDocument();
    expect(screen.getByText(/\$ 99.99/)).toBeInTheDocument();
    expect(screen.getByText('More Details')).toBeInTheDocument();
    expect(screen.getByText('ADD TO CART')).toBeInTheDocument();
  });

  it('renders Layout component with correct title', () => {
    const mockValues = {
      results: []
    };
    require('../context/search').useSearch.mockReturnValue([mockValues, jest.fn()]);

    render(<Search />);
    
    const layout = screen.getByTestId('mock-layout');
    expect(layout).toHaveAttribute('data-title', 'Search results');
  });

  it('truncates product descriptions to exactly 30 characters plus ellipsis', () => {
    const longDescription = 'This is a description that is definitely longer than thirty characters';
    const expectedTruncated = longDescription.substring(0, 30) + '...';
    
    const mockProducts = [
      {
        _id: '1',
        name: 'Test Product',
        description: longDescription,
        price: 99.99
      }
    ];

    const mockValues = {
      results: mockProducts
    };
    require('../context/search').useSearch.mockReturnValue([mockValues, jest.fn()]);

    render(<Search />);
    
    const truncatedDescription = screen.getByText(expectedTruncated);
    expect(truncatedDescription).toBeInTheDocument();
    expect(truncatedDescription.textContent).toHaveLength(33); // 30 chars + 3 dots
  });

  it('displays correct product image source', () => {
    const mockProducts = [
      {
        _id: '1',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99
      }
    ];

    const mockValues = {
      results: mockProducts
    };
    require('../context/search').useSearch.mockReturnValue([mockValues, jest.fn()]);

    render(<Search />);
    
    const productImage = screen.getByRole('img', { name: 'Test Product' });
    expect(productImage).toHaveAttribute('src', `/api/v1/product/product-photo/1`);
  });
});
