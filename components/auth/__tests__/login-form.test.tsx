import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../login-form';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form with all required fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Remember me for 30 days')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    // Clear any default values and blur to trigger validation
    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('should call onSubmit prop when provided', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const rememberCheckbox = screen.getByLabelText('Remember me for 30 days');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(rememberCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123', true);
    });
  });

  it('should make API call when no onSubmit prop provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          remember: false,
        }),
      });
    });
  });

  it('should display server error from API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    } as Response);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should display external error prop', () => {
    render(<LoginForm error="External error message" />);

    expect(screen.getByText('External error message')).toBeInTheDocument();
  });

  it('should show loading state when isLoading prop is true', () => {
    render(<LoginForm isLoading={true} />);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state during form submission', async () => {
    const mockOnSubmit = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<LoginForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });
  });

  it('should handle onSubmit errors gracefully', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should toggle remember me checkbox', () => {
    render(<LoginForm />);

    const rememberCheckbox = screen.getByLabelText('Remember me for 30 days') as HTMLInputElement;

    expect(rememberCheckbox.checked).toBe(false);

    fireEvent.click(rememberCheckbox);
    expect(rememberCheckbox.checked).toBe(true);

    fireEvent.click(rememberCheckbox);
    expect(rememberCheckbox.checked).toBe(false);
  });
});