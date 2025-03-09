import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

// Mock the Layout component
jest.mock('./../../components/Layout', () => {
  return ({ children, title }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  );
});

// Mock react-router-dom with a mockNavigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock toast methods properly
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

describe('Register Component - Additional Tests', () => {
  // Set up the axios mock before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios.post specifically, not the whole axios object
    axios.post = jest.fn();
  });

  it('should navigate to login page after successful registration', async () => {
    // Mock the successful response
    axios.post.mockResolvedValue({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out the form
    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
    
    // Check navigation was called with the right path
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });

  it('should show specific error message when API returns error message', async () => {
    // Mock response with error message
    axios.post.mockResolvedValue({ data: { success: false, message: 'Email already registered' } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out the form
    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Email already registered');
  });

  it('should ensure form data is properly passed to the API', async () => {
    // Mock successful response
    axios.post.mockResolvedValue({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    const testData = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'securepass123',
      phone: '9876543210',
      address: '456 Avenue',
      DOB: '1995-05-15',
      answer: 'Basketball'
    };

    // Fill out the form with test data
    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: testData.name } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: testData.email } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: testData.password } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: testData.phone } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: testData.address } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: testData.DOB } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: testData.answer } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', testData);
    });
  });

  it('should handle general error during API call', async () => {
    // Mock API failure with generic error
    axios.post.mockRejectedValue(new Error('Network error'));

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out the form
    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  // Test for empty fields - note that HTML5 validation prevents submission
  // so we need a different approach to test this
  it('should validate required fields', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test that the name field is required
    const nameInput = getByPlaceholderText('Enter Your Name');
    expect(nameInput).toHaveAttribute('required');
    
    // Test that email field is required
    const emailInput = getByPlaceholderText('Enter Your Email');
    expect(emailInput).toHaveAttribute('required');
    
    // Check other required fields
    expect(getByPlaceholderText('Enter Your Password')).toHaveAttribute('required');
    expect(getByPlaceholderText('Enter Your Phone')).toHaveAttribute('required');
    expect(getByPlaceholderText('Enter Your Address')).toHaveAttribute('required');
    expect(getByPlaceholderText('Enter Your DOB')).toHaveAttribute('required');
    expect(getByPlaceholderText('What is Your Favorite sports')).toHaveAttribute('required');
  });

  it('should handle form state changes correctly', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    const nameInput = getByPlaceholderText('Enter Your Name');
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    expect(nameInput.value).toBe('Test Name');

    const emailInput = getByPlaceholderText('Enter Your Email');
    fireEvent.change(emailInput, { target: { value: 'test@email.com' } });
    expect(emailInput.value).toBe('test@email.com');
    
    // Test that clearing a field works
    fireEvent.change(nameInput, { target: { value: '' } });
    expect(nameInput.value).toBe('');
  });

  it('should check form has proper elements and labels', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify form title
    expect(getByText('REGISTER FORM')).toBeInTheDocument();
    
    // Verify all input fields exist
    expect(getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Phone')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
    expect(getByPlaceholderText('What is Your Favorite sports')).toBeInTheDocument();
    
    // Verify submit button
    expect(getByText('REGISTER')).toBeInTheDocument();
  });

  it('should render with the correct layout title', () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify the layout title
    expect(getByTestId('layout').getAttribute('data-title')).toBe('Register - Ecommerce App');
  });
});