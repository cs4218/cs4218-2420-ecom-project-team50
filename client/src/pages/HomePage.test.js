import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import HomePage from './HomePage';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

jest.mock('../context/cart', () => ({
  useCart: () => [[], jest.fn()]
}));

jest.mock('../components/Layout', () => {
  return ({ children }) => <div data-testid="mock-layout">{children}</div>;
});

jest.mock('../components/Prices', () => ({
  Prices: [
    { _id: 1, name: '$0-50', array: [0, 49] },
    { _id: 2, name: '$50-100', array: [50, 99] }
  ]
}));

jest.mock('react-icons/ai', () => ({
  AiOutlineReload: () => 'reload-icon'
}));

const mockConsoleLog = jest.spyOn(console, 'log');

describe('HomePage Component', () => {
  const mockProducts = [
    {
      _id: '1',
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      slug: 'test-product'
    }
  ];

  const moreProducts = [
    {
      _id: '2',
      name: 'Another Product',
      description: 'Another Description',
      price: 79.99,
      slug: 'another-product'
    }
  ];

  const mockCategories = [
    { _id: '1', name: 'Category 1' },
    { _id: '2', name: 'Category 2' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes('/category/get-category')) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
      if (url.includes('/product/product-list')) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      if (url.includes('/product/product-count')) {
        return Promise.resolve({ data: { total: 1 } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  describe('Initial Rendering', () => {
    it('should render homepage with initial data', async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('All Products')).toBeInTheDocument();
      });

      expect(screen.getByText('Filter By Category')).toBeInTheDocument();
      expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    });

    it('should load and display products correctly', async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Test Description...')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering Functionality', () => {
    it('should handle category filter selection', async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Category 1')).toBeInTheDocument();
      });

      axios.post.mockResolvedValueOnce({
        data: { products: [mockProducts[0]] }
      });

      fireEvent.click(screen.getByText('Category 1'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
          checked: ['1'],
          radio: []
        });
      });
    });

    it('should handle price filter selection', async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('$0-50')).toBeInTheDocument();
      });

      axios.post.mockResolvedValueOnce({
        data: { products: [mockProducts[0]] }
      });

      fireEvent.click(screen.getByText('$0-50'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
          checked: [],
          radio: [0, 49]
        });
      });
    });

    it('should reset filters when reset button is clicked', async () => {
      const { location } = window;
      delete window.location;
      window.location = { reload: jest.fn() };

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('RESET FILTERS')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('RESET FILTERS'));
      expect(window.location.reload).toHaveBeenCalled();

      window.location = location;
    });
  });

  describe('Cart Functionality', () => {
    it('should handle add to cart functionality', async () => {
      const setCart = jest.fn();
      jest.spyOn(require('../context/cart'), 'useCart').mockImplementation(() => [[], setCart]);

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ADD TO CART')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('ADD TO CART'));

      expect(setCart).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
    });

    it('should handle localStorage cart update correctly', async () => {
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ADD TO CART')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('ADD TO CART'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cart',
        JSON.stringify([mockProducts[0]])
      );

      expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
    });
  });

  describe('Load More Functionality', () => {
    
    it('should append new products and resets loading state after loadMore is called', async () => {
        // Set up axios mocks for pagination:
        axios.get.mockImplementation((url) => {
          if (url.includes('/product/product-count')) {
            return Promise.resolve({ data: { total: 2 } });
          }
          if (url.includes('/product/product-list/1')) {
            return Promise.resolve({ data: { products: mockProducts } });
          }
          if (url.includes('/product/product-list/2')) {
            return Promise.resolve({ data: { products: moreProducts } });
          }
          return Promise.resolve({ data: {} });
        });
      
        render(
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        );
      
        await waitFor(() => expect(screen.getByText('Test Product')).toBeInTheDocument());
      
        const loadMoreButton = screen.getByText((content, element) =>
          element.classList.contains('loadmore') && content.includes('Loadmore')
        );
        fireEvent.click(loadMoreButton);
      
        expect(screen.getByText('Loading ...')).toBeInTheDocument();
      
        await waitFor(() => expect(screen.getByText('Another Product')).toBeInTheDocument());
      
        expect(screen.queryByText('Loading ...')).not.toBeInTheDocument();
      
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Another Product')).toBeInTheDocument();
    });
      

    it('should render load more button when more products are available', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/product/product-count')) {
          return Promise.resolve({ data: { total: 4 } });
        }
        if (url.includes('/product/product-list')) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const button = screen.getByText((content, element) => {
          return element.classList.contains('loadmore') && 
                 content.includes('Loadmore');
        });
        expect(button).toBeInTheDocument();
      });
    });

    it('should not render load more button when no more products available', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/product/product-count')) {
          return Promise.resolve({ data: { total: 1 } });
        }
        if (url.includes('/product/product-list')) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const button = screen.queryByRole('button', { 
          name: /Loadmore/i 
        });
        expect(button).not.toBeInTheDocument();
      });
    });

    it('should show loading state while fetching more products', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/product/product-count')) {
          return Promise.resolve({ data: { total: 4 } });
        }
        if (url.includes('/product/product-list')) {
          return new Promise(resolve => 
            setTimeout(() => 
              resolve({ data: { products: mockProducts } }), 100
            )
          );
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      const button = await screen.findByRole('button', { 
        name: /Loadmore/i 
      });
      fireEvent.click(button);

      expect(screen.getByText('Loading ...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('All Products')).toBeInTheDocument();
      });
    });

    it('should handle getAllProducts error case correctly', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/product/product-list')) {
          return Promise.reject(new Error('Failed to fetch products'));
        }
        if (url.includes('/category/get-category')) {
          return Promise.resolve({ data: { success: true, category: mockCategories } });
        }
        if (url.includes('/product/product-count')) {
          return Promise.resolve({ data: { total: 1 } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading ...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('All Products')).toBeInTheDocument();
      expect(screen.getByText('Filter By Category')).toBeInTheDocument();
      
      const productCards = screen.queryAllByRole('img', { name: /Test Product/i });
      expect(productCards).toHaveLength(0);
    });

    it('should handle getAllCategory error case correctly', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/category/get-category')) {
          return Promise.reject(new Error('Failed to fetch categories'));
        }
        if (url.includes('/product/product-list')) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        if (url.includes('/product/product-count')) {
          return Promise.resolve({ data: { total: 1 } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('All Products')).toBeInTheDocument();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to get categories');
      expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    });

    it('should handle getTotal error case correctly', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/product/product-count')) {
          return Promise.reject(new Error('Failed to fetch product count'));
        }
        if (url.includes('/product/product-list')) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        if (url.includes('/category/get-category')) {
          return Promise.resolve({ data: { success: true, category: mockCategories } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('All Products')).toBeInTheDocument();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to get total count');

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('should handle loadMore error case correctly', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/product/product-count')) {
          return Promise.resolve({ data: { total: 4 } });
        }
        if (url.includes('/product/product-list/1')) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        if (url.includes('/category/get-category')) {
          return Promise.resolve({ data: { success: true, category: mockCategories } });
        }
        if (url.includes('/product/product-list/2')) {
          return Promise.reject(new Error('Failed to load more products'));
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      const button = await screen.findByRole('button', { name: /Loadmore/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to get products');
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading ...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });     
  });
});