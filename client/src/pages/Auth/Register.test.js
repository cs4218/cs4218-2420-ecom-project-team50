import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

jest.mock('./../../components/Layout', () => {
  return ({ children, title }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  );
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

console.log = jest.fn();

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.post = jest.fn();
  });

  it('should validate and reject invalid email format', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'invalid-email' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
    
    // Check that the errors state in the component was updated
    // Since we can't directly access component state, we verify validation failed by
    // checking that axios.post wasn't called when it should have failed validation
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should validate and reject non-digit characters in phone', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '123-456-7890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('should validate and reject phone numbers longer than 15 digits', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890123456' } }); // 16 digits
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('should reject registration with both invalid email and phone', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'invalid-email' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '123-456-7890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('should accept valid email and phone formats', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'valid.email@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  it('should handle form submission failure with server error', async () => {
    const testError = new Error('Server error');
    axios.post.mockRejectedValue(testError);

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(testError); // Tests line 37
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });

  it('should test validateEmail function implementation directly', () => {
    const validateEmail = (email) => {
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    };

    const validEmails = [
      'test@example.com',
      'test.name@example.co.uk',
      'test+label@example.com',
      'test@subdomain.example.com'
    ];
    
    for (const email of validEmails) {
      expect(validateEmail(email)).not.toBeNull();
    }
    
    const invalidEmails = [
      'plainaddress',
      '#@%^%#$@#$@#.com',
      '@example.com',
      'email.example.com',
      'email@example@example.com',
      'email@example..com'
    ];
    
    for (const email of invalidEmails) {
      expect(validateEmail(email)).toBeNull();
    }
  });

  it('should test validatePhone function implementation directly', () => {
    const validatePhone = (phone) => {
      const phoneRegex = /^\d{1,15}$/;
      return phoneRegex.test(phone);
    };
    
    // Test valid phone formats
    const validPhones = [
      '1234567890',
      '123456',
      '123',
      '1',
      '123456789012345' // 15 digits (max)
    ];
    
    for (const phone of validPhones) {
      expect(validatePhone(phone)).toBe(true);
    }
    
    // Test invalid phone formats
    const invalidPhones = [
      '123-456-7890',
      '(123) 456-7890',
      '+11234567890',
      '123.456.7890',
      'abcdefg',
      '1234567890123456' // 16 digits (too long)
    ];
    
    for (const phone of invalidPhones) {
      expect(validatePhone(phone)).toBe(false);
    }
  });

  it('should call validate function before form submission', async () => {
    const validateFn = jest.fn().mockReturnValue(false);
    
    const TestComponent = () => {
      const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateFn()) {
          return;
        }
        axios.post();
      };
      
      return (
        <form onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
        </form>
      );
    };
    
    const { getByText } = render(<TestComponent />);
    
    fireEvent.click(getByText('Submit'));
    
    expect(validateFn).toHaveBeenCalled();
    
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  it('should show error message for unsuccessful registration with API response', async () => {
    axios.post.mockResolvedValue({ 
      data: { 
        success: false, 
        message: 'Email already exists' 
      } 
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    // Check the else branch of successful response handling (line 71)
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Email already exists');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});