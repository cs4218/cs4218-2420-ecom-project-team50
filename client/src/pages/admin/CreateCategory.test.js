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

    expect(screen.getByText('Admin Menu')).toBeInTheDocument();

    await waitFor(() => {
      mockCategories.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
      });
    });

    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });


  test('creates a new category successfully', async () => {
    render(<CreateCategory />);

    const input = screen.getByTestId('create-category-input');
    const submitButton = screen.getByText('Submit');

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

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

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

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    const modalInput = screen.getByTestId('update-category-input');
    const updateForm = screen.getByTestId('update-category-form');

    fireEvent.change(modalInput, { target: { value: 'Updated Category' } });
    fireEvent.submit(updateForm);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });

  test('deletes a category successfully', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

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

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    const modal = screen.getByTestId('modal');
    expect(modal).toBeInTheDocument();

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  test('prevents creating a category with an existing name', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const input = screen.getByTestId('create-category-input');
    const submitButton = screen.getByText('Submit');

    // Try to create with existing name
    fireEvent.change(input, { target: { value: 'Category 1' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Category "Category 1" already exists');
      expect(input.value).toBe(''); // Input should be reset
    });
  });

  test('prevents creating a category with an existing name (case insensitive)', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const input = screen.getByTestId('create-category-input');
    const submitButton = screen.getByText('Submit');

    // Try to create with existing name (different case)
    fireEvent.change(input, { target: { value: 'category 1' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Category "category 1" already exists');
      expect(input.value).toBe(''); // Input should be reset
    });
  });

  test('prevents updating category to an existing name', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('Category 2')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit Category 1

    const modalInput = screen.getByTestId('update-category-input');
    const updateForm = screen.getByTestId('update-category-form');

    // Try to update to existing name (Category 2)
    fireEvent.change(modalInput, { target: { value: 'Category 2' } });
    fireEvent.submit(updateForm);

    await waitFor(() => {
      expect(axios.put).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Category "Category 2" already exists');
      expect(modalInput.value).toBe('Category 1'); // Should reset to original name
    });
  });

  test('prevents updating category to an existing name (case insensitive)', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('Category 2')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit Category 1

    const modalInput = screen.getByTestId('update-category-input');
    const updateForm = screen.getByTestId('update-category-form');

    // Try to update to existing name with different case
    fireEvent.change(modalInput, { target: { value: 'category 2' } });
    fireEvent.submit(updateForm);

    await waitFor(() => {
      expect(axios.put).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Category "category 2" already exists');
      expect(modalInput.value).toBe('Category 1'); // Should reset to original name
    });
  });

  test('allows updating a category name with different case', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit Category 1

    const modalInput = screen.getByTestId('update-category-input');
    const updateForm = screen.getByTestId('update-category-form');

    // Change case of the same category
    fireEvent.change(modalInput, { target: { value: 'category 1' } });
    fireEvent.submit(updateForm);

    // Should allow update since it's the same category (just case change)
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/category/update-category/1', 
        { name: 'category 1' }
      );
      expect(toast.success).toHaveBeenCalledWith('category 1 is updated');
    });
  });

  test('prevents creating a category with empty name', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const input = screen.getByTestId('create-category-input');
    const submitButton = screen.getByText('Submit');

    // Try to submit with empty name
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Category name cannot be empty');
    });
  });

  test('prevents creating a category with only whitespace', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const input = screen.getByTestId('create-category-input');
    const submitButton = screen.getByText('Submit');

    // Try to submit with whitespace only
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Category name cannot be empty');
    });
  });

  test('prevents updating a category to empty name', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit Category 1

    const modalInput = screen.getByTestId('update-category-input');
    const updateForm = screen.getByTestId('update-category-form');

    // Try to update to empty name
    fireEvent.change(modalInput, { target: { value: '' } });
    fireEvent.submit(updateForm);

    await waitFor(() => {
      expect(axios.put).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Category name cannot be empty');
      expect(modalInput.value).toBe('Category 1'); // Should reset to original name
    });
  });

  test('prevents updating a category to whitespace only', async () => {
    render(<CreateCategory />);

    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit Category 1

    const modalInput = screen.getByTestId('update-category-input');
    const updateForm = screen.getByTestId('update-category-form');

    // Try to update to whitespace only
    fireEvent.change(modalInput, { target: { value: '   ' } });
    fireEvent.submit(updateForm);

    await waitFor(() => {
      expect(axios.put).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Category name cannot be empty');
      expect(modalInput.value).toBe('Category 1'); // Should reset to original name
    });
  });
});