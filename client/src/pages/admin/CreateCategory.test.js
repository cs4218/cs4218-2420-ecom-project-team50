import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateCategory from './CreateCategory';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('./../../components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('./../../components/AdminMenu', () => () => <div>Admin Menu</div>);
jest.mock('antd', () => ({
  Modal: ({ children, visible, onCancel }) => 
    visible ? (
      <div data-testid="modal">
        {children}
        <button aria-label="close" onClick={onCancel}>Close</button>
      </div>
    ) : null
}));
jest.mock('../../components/Form/CategoryForm', () => ({ 
  handleSubmit, 
  value, 
  setValue 
}) => (
  <form 
    data-testid={value ? 'update-category-form' : 'create-category-form'} 
    onSubmit={handleSubmit}
  >
    <input 
      data-testid={value ? 'update-category-input' : 'create-category-input'}
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
    />
    <button type="submit">Submit</button>
  </form>
));

describe('CreateCategory Component', () => {
  const mockCategories = [
    { _id: '1', name: 'Category 1' },
    { _id: '2', name: 'Category 2' }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    axios.get.mockResolvedValue({
      data: { 
        success: true, 
        category: mockCategories 
      }
    });

    axios.post.mockResolvedValue({
      data: { success: true }
    });

    axios.put.mockResolvedValue({
      data: { success: true }
    });

    axios.delete.mockResolvedValue({
      data: { success: true }
    });
  });

  test('renders CreateCategory component and fetches categories on mount', async () => {
    render(<CreateCategory />);

    // Check if AdminMenu is rendered
    expect(screen.getByText('Admin Menu')).toBeInTheDocument();

    // Wait for categories to be loaded
    await waitFor(() => {
      mockCategories.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
      });
    });

    // Verify axios get was called
    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });


  test('creates a new category successfully', async () => {
    render(<CreateCategory />);

    const input = screen.getByTestId('create-category-input');
    const submitButton = screen.getByText('Submit');

    // Enter category name
    fireEvent.change(input, { target: { value: 'New Category' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/category/create-category', { 
        name: 'New Category' 
      });
      expect(toast.success).toHaveBeenCalledWith('New Category is created');
    });
  });

  test('handles category creation failure', async () => {
    axios.post.mockResolvedValue({
      data: { 
        success: false, 
        message: 'Creation failed' 
      }
    });

    render(<CreateCategory />);

    const input = screen.getByTestId('create-category-input');
    const submitButton = screen.getByText('Submit');

    // Enter category name
    fireEvent.change(input, { target: { value: 'New Category' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Creation failed');
    });
  });

  test('handles network error during category creation', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    render(<CreateCategory />);

    const input = screen.getByTestId('create-category-input');
    const submitButton = screen.getByText('Submit');

    // Enter category name
    fireEvent.change(input, { target: { value: 'New Category' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong in input form');
    });
  });

  test('handles error when fetching categories fails', async () => {
    axios.get.mockRejectedValue(new Error('Fetch failed'));

    render(<CreateCategory />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong in getting catgeory');
    });
  });

  test('handles unsuccessful category fetch response', async () => {
    axios.get.mockResolvedValue({
      data: { 
        success: false,
        message: 'Failed to fetch categories' 
      }
    });

    render(<CreateCategory />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch categories');
    });
  });

  test('updates an existing category', async () => {
    render(<CreateCategory />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    const modalInput = screen.getByTestId('update-category-input');
    const updateForm = screen.getByTestId('update-category-form');

    // Verify the input is pre-filled with the category name
    expect(modalInput).toHaveValue('Category 1');

    // Change category name
    fireEvent.change(modalInput, { target: { value: 'Updated Category' } });
    fireEvent.submit(updateForm);

    // Wait for update call
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/category/update-category/1', 
        { name: 'Updated Category' }
      );
      expect(toast.success).toHaveBeenCalledWith('Updated Category is updated');
    });
  });

  test('handles update category failure with error message', async () => {
    axios.put.mockResolvedValue({
      data: { 
        success: false, 
        message: 'Update failed: Category name already exists' 
      }
    });

    render(<CreateCategory />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Find modal form
    const modalInput = screen.getByTestId('update-category-input');
    const updateForm = screen.getByTestId('update-category-form');

    // Change category name
    fireEvent.change(modalInput, { target: { value: 'Updated Category' } });
    fireEvent.submit(updateForm);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Update failed: Category name already exists');
    });
  });

  test('handles network error during category update', async () => {
    axios.put.mockRejectedValue(new Error('Network error'));

    render(<CreateCategory />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Find modal form
    const modalInput = screen.getByTestId('update-category-input');
    const updateForm = screen.getByTestId('update-category-form');

    // Change category name
    fireEvent.change(modalInput, { target: { value: 'Updated Category' } });
    fireEvent.submit(updateForm);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });

  test('deletes a category successfully', async () => {
    render(<CreateCategory />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Wait for delete call
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/v1/category/delete-category/1');
      expect(toast.success).toHaveBeenCalledWith('Category is deleted');
    });
  });

  test('handles delete category failure with error message', async () => {
    axios.delete.mockResolvedValue({
      data: { 
        success: false, 
        message: 'Delete failed: Category is in use' 
      }
    });

    render(<CreateCategory />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Delete failed: Category is in use');
    });
  });

  test('handles network error during category deletion', async () => {
    axios.delete.mockRejectedValue(new Error('Network error'));

    render(<CreateCategory />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });

  test('closes the update modal when cancel is clicked', async () => {
    render(<CreateCategory />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Verify modal is visible
    const modal = screen.getByTestId('modal');
    expect(modal).toBeInTheDocument();

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);

    // Verify modal is no longer visible
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });
});