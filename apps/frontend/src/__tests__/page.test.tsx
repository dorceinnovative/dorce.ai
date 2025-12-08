import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../app/page';

// Mock the auth context
jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('Home Page', () => {
  it('renders the Apple-style landing hero', () => {
    render(<Home />);
    expect(screen.getByText('One Platform.')).toBeInTheDocument();
    expect(screen.getByText('Intelligent.')).toBeInTheDocument();
    expect(screen.getByText('Infinite Possibilities.')).toBeInTheDocument();
  });

  it('renders primary CTAs', () => {
    render(<Home />);
    expect(screen.getByText('Register Your Business')).toBeInTheDocument();
    expect(screen.getByText('Get Your National ID')).toBeInTheDocument();
    expect(screen.getByText('Explore Services')).toBeInTheDocument();
  });

  it('renders navigation logo text', () => {
    render(<Home />);
    expect(screen.getByText('DORCE')).toBeInTheDocument();
  });
});
