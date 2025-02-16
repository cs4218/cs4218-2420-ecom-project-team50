import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AdminDashboard from './AdminDashboard';

jest.mock('../../components/Layout', () => {
  return ({ children }) => <div data-testid="mock-layout">{children}</div>;
});

jest.mock('../../components/AdminMenu', () => {
  return function MockAdminMenu() {
    return <div data-testid="mock-admin-menu">Admin Menu</div>;
  };
});

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [
    {
      user: {
        name: 'Test Admin',
        email: 'admin@test.com',
        phone: '1234567890'
      }
    }
  ])
}));

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the admin dashboard with layout', () => {
    const { getByTestId } = render(<AdminDashboard />);
    expect(getByTestId('mock-layout')).toBeInTheDocument();
  });

  it('renders the admin menu', () => {
    const { getByTestId } = render(<AdminDashboard />);
    expect(getByTestId('mock-admin-menu')).toBeInTheDocument();
  });

  it('displays admin information correctly', () => {
    const { getByText } = render(<AdminDashboard />);
    
    expect(getByText('Admin Name : Test Admin')).toBeInTheDocument();
    expect(getByText('Admin Email : admin@test.com')).toBeInTheDocument();
    expect(getByText('Admin Contact : 1234567890')).toBeInTheDocument();
  });

  it('renders with null user data', () => {
    require('../../context/auth').useAuth.mockImplementation(() => [{ user: null }]);
    
    const { getByTestId } = render(<AdminDashboard />);
    expect(getByTestId('mock-layout')).toBeInTheDocument();
  });

  it('renders with missing user fields', () => {
    require('../../context/auth').useAuth.mockImplementation(() => [{
      user: {
        name: 'Test Admin'
        // email and phone intentionally omitted
      }
    }]);
    
    const { getByText } = render(<AdminDashboard />);
    
    expect(getByText(/Admin Name : Test Admin/)).toBeInTheDocument();
    expect(getByText(/Admin Email :/)).toBeInTheDocument();
    expect(getByText(/Admin Contact :/)).toBeInTheDocument();
  });
});