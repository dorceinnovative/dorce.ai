import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '../app/dashboard/page';

// Mock the auth context and router
jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    user: { firstName: 'Test', email: 'test@dorce.ai' },
    isLoading: false,
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Dashboard Page', () => {
  it('renders the dashboard with user welcome', () => {
    render(<DashboardPage />);
    
    // Check for welcome message
    expect(screen.getByText('Welcome, Test!')).toBeInTheDocument();
    
    // Check for description
    expect(screen.getByText('Your personal AI-powered financial assistant is ready to help.')).toBeInTheDocument();
  });

  it('renders all quick action cards', () => {
    render(<DashboardPage />);
    
    // Check for action cards
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByText('Chat with Dorce')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('renders navigation with logo', () => {
    render(<DashboardPage />);
    
    // Check for brand name in navigation
    expect(screen.getByText('Dorce.ai')).toBeInTheDocument();
    
    // Check for sign out button
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });
});