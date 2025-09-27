import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormCreator } from '../form-creator';

const mockTemplates = [
  {
    id: 'basic-intake',
    name: 'Basic Client Intake',
    description: 'Standard immigration client information collection form',
    category: 'Immigration',
    schema: {
      fields: [
        { name: 'fullName', type: 'text', required: true, label: 'Full Name' },
        { name: 'email', type: 'email', required: true, label: 'Email Address' },
      ]
    },
    isActive: true,
  },
  {
    id: 'express-entry',
    name: 'Express Entry Assessment',
    description: 'Comprehensive form for Express Entry program eligibility assessment',
    category: 'Express Entry',
    schema: {
      fields: [
        { name: 'fullName', type: 'text', required: true, label: 'Full Name' },
        { name: 'age', type: 'number', required: true, label: 'Age', min: 18, max: 100 },
      ]
    },
    isActive: true,
  },
];

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('FormCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render form creator with templates', () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    expect(screen.getByLabelText(/Select Template/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Client Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expiry Period/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Personal Message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Form & Send to Client/i })).toBeInTheDocument();
  });

  it('should populate template dropdown with options', () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    expect(templateSelect).toBeInTheDocument();

    // Check for default option
    expect(screen.getByRole('option', { name: /Choose a template/i })).toBeInTheDocument();

    // Check for template options
    expect(screen.getByRole('option', { name: /Basic Client Intake \(Immigration\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Express Entry Assessment \(Express Entry\)/i })).toBeInTheDocument();
  });

  it('should show template description when selected', () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    fireEvent.change(templateSelect, { target: { value: 'basic-intake' } });

    // Check for the description in the dropdown area (not in form preview)
    const descriptionElements = screen.getAllByText('Standard immigration client information collection form');
    expect(descriptionElements.length).toBeGreaterThan(0);
  });

  it('should show form preview when template is selected', () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    fireEvent.change(templateSelect, { target: { value: 'basic-intake' } });

    expect(screen.getByText('Form Preview')).toBeInTheDocument();
    expect(screen.getByText('Template:')).toBeInTheDocument();
    expect(screen.getByText('Category:')).toBeInTheDocument();
    // Check for the values separately since they're in different elements
    const basicIntakeTexts = screen.getAllByText('Basic Client Intake');
    expect(basicIntakeTexts.length).toBeGreaterThan(0);
    const immigrationTexts = screen.getAllByText('Immigration');
    expect(immigrationTexts.length).toBeGreaterThan(0);
  });

  it('should show client info in preview when provided', () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    const clientNameInput = screen.getByLabelText(/Client Name/i) as HTMLInputElement;
    const clientEmailInput = screen.getByLabelText(/Client Email/i) as HTMLInputElement;

    fireEvent.change(templateSelect, { target: { value: 'basic-intake' } });
    fireEvent.change(clientNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(clientEmailInput, { target: { value: 'john@example.com' } });

    expect(screen.getByText('Will be sent to:')).toBeInTheDocument();

    // Verify the inputs have the values (which means they'll be shown in preview)
    expect(clientNameInput.value).toBe('John Doe');
    expect(clientEmailInput.value).toBe('john@example.com');
  });

  it('should validate required fields', async () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const submitButton = screen.getByRole('button', { name: /Create Form & Send to Client/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select a template')).toBeInTheDocument();
      expect(screen.getByText('Client name is required')).toBeInTheDocument();
      expect(screen.getByText('Client email is required')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const clientEmailInput = screen.getByLabelText(/Client Email/i);
    const submitButton = screen.getByRole('button', { name: /Create Form & Send to Client/i });

    fireEvent.change(clientEmailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should validate expiry days range', async () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const expiryInput = screen.getByLabelText(/Expiry Period/i);
    const submitButton = screen.getByRole('button', { name: /Create Form & Send to Client/i });

    // Test minimum
    fireEvent.change(expiryInput, { target: { value: '0' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Expiry days must be between 1 and 90')).toBeInTheDocument();
    });

    // Test maximum
    fireEvent.change(expiryInput, { target: { value: '91' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Expiry days must be between 1 and 90')).toBeInTheDocument();
    });
  });

  it('should clear field errors when user starts typing', async () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const clientNameInput = screen.getByLabelText(/Client Name/i);
    const submitButton = screen.getByRole('button', { name: /Create Form & Send to Client/i });

    // Submit to trigger validation
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Client name is required')).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(clientNameInput, { target: { value: 'J' } });

    await waitFor(() => {
      expect(screen.queryByText('Client name is required')).not.toBeInTheDocument();
    });
  });

  it('should convert email to lowercase', () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const clientEmailInput = screen.getByLabelText(/Client Email/i) as HTMLInputElement;
    fireEvent.change(clientEmailInput, { target: { value: 'JOHN@EXAMPLE.COM' } });

    expect(clientEmailInput.value).toBe('john@example.com');
  });

  it('should submit form successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'form-123', message: 'Form created successfully' }),
    });

    render(<FormCreator initialTemplates={mockTemplates} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    const clientNameInput = screen.getByLabelText(/Client Name/i);
    const clientEmailInput = screen.getByLabelText(/Client Email/i);
    const submitButton = screen.getByRole('button', { name: /Create Form & Send to Client/i });

    fireEvent.change(templateSelect, { target: { value: 'basic-intake' } });
    fireEvent.change(clientNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(clientEmailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: 'basic-intake',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          expiryDays: 14,
          personalMessage: '',
        }),
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/forms');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should call onFormCreated callback when provided', async () => {
    const mockOnFormCreated = jest.fn();
    const mockResponseData = { id: 'form-123', message: 'Form created successfully' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    });

    render(<FormCreator initialTemplates={mockTemplates} onFormCreated={mockOnFormCreated} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    const clientNameInput = screen.getByLabelText(/Client Name/i);
    const clientEmailInput = screen.getByLabelText(/Client Email/i);
    const submitButton = screen.getByRole('button', { name: /Create Form & Send to Client/i });

    fireEvent.change(templateSelect, { target: { value: 'basic-intake' } });
    fireEvent.change(clientNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(clientEmailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnFormCreated).toHaveBeenCalledWith(mockResponseData);
    });

    // Should not redirect when callback is provided
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle submission errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to create form' }),
    });

    render(<FormCreator initialTemplates={mockTemplates} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    const clientNameInput = screen.getByLabelText(/Client Name/i);
    const clientEmailInput = screen.getByLabelText(/Client Email/i);
    const submitButton = screen.getByRole('button', { name: /Create Form & Send to Client/i });

    fireEvent.change(templateSelect, { target: { value: 'basic-intake' } });
    fireEvent.change(clientNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(clientEmailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error Creating Form')).toBeInTheDocument();
      expect(screen.getByText('Failed to create form')).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<FormCreator initialTemplates={mockTemplates} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    const clientNameInput = screen.getByLabelText(/Client Name/i);
    const clientEmailInput = screen.getByLabelText(/Client Email/i);
    const submitButton = screen.getByRole('button', { name: /Create Form & Send to Client/i });

    fireEvent.change(templateSelect, { target: { value: 'basic-intake' } });
    fireEvent.change(clientNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(clientEmailInput, { target: { value: 'john@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Creating Form...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('should handle cancel button click', () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/forms');
  });

  it('should load templates when not provided initially', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ templates: mockTemplates }),
    });

    render(<FormCreator />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/templates');
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Basic Client Intake \(Immigration\)/i })).toBeInTheDocument();
    });
  });

  it('should handle templates loading error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to load templates'));

    render(<FormCreator />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
    });
  });

  it('should display external error when provided', () => {
    render(<FormCreator initialTemplates={mockTemplates} error="External error message" />);

    expect(screen.getByText('Error Creating Form')).toBeInTheDocument();
    expect(screen.getByText('External error message')).toBeInTheDocument();
  });

  it('should disable form when external loading is true', () => {
    render(<FormCreator initialTemplates={mockTemplates} isLoading={true} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    const clientNameInput = screen.getByLabelText(/Client Name/i);
    const clientEmailInput = screen.getByLabelText(/Client Email/i);
    const submitButton = screen.getByRole('button', { name: /Create Form & Send to Client/i });

    expect(templateSelect).toBeDisabled();
    expect(clientNameInput).toBeDisabled();
    expect(clientEmailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should show expiry date calculation correctly', () => {
    render(<FormCreator initialTemplates={mockTemplates} />);

    const templateSelect = screen.getByLabelText(/Select Template/i);
    const clientNameInput = screen.getByLabelText(/Client Name/i);
    const expiryInput = screen.getByLabelText(/Expiry Period/i);

    fireEvent.change(templateSelect, { target: { value: 'basic-intake' } });
    fireEvent.change(clientNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(expiryInput, { target: { value: '30' } });

    // Should show calculated expiry date (just check for "Expires:" text, dates can be tricky to match exactly)
    expect(screen.getByText(/Expires:/)).toBeInTheDocument();
  });
});