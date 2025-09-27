import React from 'react';
import { describe, expect, it } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormRenderer } from '../form-renderer';

// Mock schema for testing
const mockSchema = {
  type: 'object',
  title: 'Test Form',
  description: 'A test form for validation',
  properties: {
    fullName: {
      type: 'string',
      title: 'Full Name',
      description: 'Enter your full name',
      placeholder: 'Enter full name',
      minLength: 2,
      maxLength: 100,
    },
    email: {
      type: 'string',
      title: 'Email Address',
      description: 'Your email address',
      placeholder: 'Enter email address',
      format: 'email',
    },
    age: {
      type: 'number',
      title: 'Age',
      description: 'Your age in years',
      minimum: 18,
      maximum: 100,
    },
    maritalStatus: {
      type: 'string',
      title: 'Marital Status',
      enum: ['Single', 'Married', 'Divorced'],
      enumNames: ['Single', 'Married', 'Divorced'],
    },
    address: {
      type: 'object',
      title: 'Address',
      properties: {
        street: {
          type: 'string',
          title: 'Street Address',
        },
        city: {
          type: 'string',
          title: 'City',
        },
      },
      required: ['street', 'city'],
    },
  },
  required: ['fullName', 'email', 'age'],
};

const mockUISchema = {
  'ui:order': ['fullName', 'email', 'age', 'maritalStatus', 'address'],
  fullName: {
    'ui:placeholder': 'Enter full name',
  },
  email: {
    'ui:placeholder': 'Enter email address',
  },
  age: {
    'ui:widget': 'number',
  },
  maritalStatus: {
    'ui:widget': 'select',
  },
  address: {
    'ui:order': ['street', 'city'],
  },
};

describe('FormRenderer', () => {
  const defaultProps = {
    schema: mockSchema,
    uiSchema: mockUISchema,
    formData: {},
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form title and description', () => {
    render(<FormRenderer {...defaultProps} />);

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('A test form for validation')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(<FormRenderer {...defaultProps} />);

    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Marital Status/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Street Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/)).toBeInTheDocument();
  });

  it('should render fields in specified UI order', () => {
    render(<FormRenderer {...defaultProps} />);

    const fieldLabels = screen.getAllByText(/Full Name|Email Address|Age|Marital Status|Street Address/);
    // Check that Full Name appears before Email Address (order matters)
    const fullNameIndex = fieldLabels.findIndex(el => el.textContent?.includes('Full Name'));
    const emailIndex = fieldLabels.findIndex(el => el.textContent?.includes('Email Address'));

    expect(fullNameIndex).toBeLessThan(emailIndex);
  });

  it('should render text fields with correct attributes', () => {
    render(<FormRenderer {...defaultProps} />);

    const fullNameField = screen.getByLabelText(/Full Name/) as HTMLInputElement;
    expect(fullNameField).toHaveAttribute('type', 'text');
    expect(fullNameField).toHaveAttribute('placeholder', 'Enter full name');
    expect(fullNameField).toHaveAttribute('required');

    const emailField = screen.getByLabelText(/Email Address/) as HTMLInputElement;
    expect(emailField).toHaveAttribute('type', 'email');
    expect(emailField).toHaveAttribute('placeholder', 'Enter email address');
  });

  it('should render number fields correctly', () => {
    render(<FormRenderer {...defaultProps} />);

    const ageField = screen.getByLabelText(/Age/) as HTMLInputElement;
    expect(ageField).toHaveAttribute('type', 'number');
    expect(ageField).toHaveAttribute('min', '18');
    expect(ageField).toHaveAttribute('max', '100');
  });

  it('should render select fields with options', () => {
    render(<FormRenderer {...defaultProps} />);

    const maritalStatusField = screen.getByLabelText(/Marital Status/) as HTMLSelectElement;
    expect(maritalStatusField.tagName).toBe('SELECT');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4); // Including placeholder option
    expect(screen.getByText('Single')).toBeInTheDocument();
    expect(screen.getByText('Married')).toBeInTheDocument();
    expect(screen.getByText('Divorced')).toBeInTheDocument();
  });

  it('should handle form data changes', () => {
    const onChange = jest.fn();
    render(<FormRenderer {...defaultProps} onChange={onChange} />);

    const fullNameField = screen.getByLabelText(/Full Name/);
    fireEvent.change(fullNameField, { target: { value: 'John Doe' } });

    expect(onChange).toHaveBeenCalledWith({
      fullName: 'John Doe',
    });
  });

  it('should handle nested object field changes', () => {
    const onChange = jest.fn();
    render(<FormRenderer {...defaultProps} onChange={onChange} />);

    const streetField = screen.getByLabelText(/Street Address/);
    fireEvent.change(streetField, { target: { value: '123 Main St' } });

    expect(onChange).toHaveBeenCalledWith({
      address: {
        street: '123 Main St',
      },
    });
  });

  it('should display field descriptions as help text', () => {
    render(<FormRenderer {...defaultProps} />);

    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByText('Your email address')).toBeInTheDocument();
    expect(screen.getByText('Your age in years')).toBeInTheDocument();
  });

  it('should pre-populate fields with existing form data', () => {
    const formData = {
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      age: 25,
      maritalStatus: 'Single',
      address: {
        street: '456 Oak Ave',
        city: 'Toronto',
      },
    };

    render(<FormRenderer {...defaultProps} formData={formData} />);

    expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe('Jane Smith');
    expect((screen.getByLabelText(/Email Address/) as HTMLInputElement).value).toBe('jane@example.com');
    expect((screen.getByLabelText(/Age/) as HTMLInputElement).value).toBe('25');
    expect((screen.getByLabelText(/Marital Status/) as HTMLSelectElement).value).toBe('Single');
    expect((screen.getByLabelText(/Street Address/) as HTMLInputElement).value).toBe('456 Oak Ave');
    expect((screen.getByLabelText(/City/) as HTMLInputElement).value).toBe('Toronto');
  });

  it('should show validation errors for required fields', () => {
    render(<FormRenderer {...defaultProps} />);

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Should show required field errors
    expect(screen.getByText(/Full Name is required/)).toBeInTheDocument();
    expect(screen.getByText(/Email Address is required/)).toBeInTheDocument();
    expect(screen.getByText(/Age is required/)).toBeInTheDocument();
  });

  it('should show validation errors for invalid data', () => {
    const formData = {
      fullName: 'John Doe',
      email: 'invalid-email', // Invalid email format
      age: 25,
    };

    render(<FormRenderer {...defaultProps} formData={formData} />);

    expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument();
  });

  it('should call onSubmit with valid data', () => {
    const onSubmit = jest.fn();
    const validFormData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      age: 30,
      maritalStatus: 'Married',
      address: {
        street: '123 Main St',
        city: 'Toronto',
      },
    };

    render(<FormRenderer {...defaultProps} formData={validFormData} onSubmit={onSubmit} />);

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(validFormData);
  });

  it('should not call onSubmit with invalid data', () => {
    const onSubmit = jest.fn();
    const onError = jest.fn();
    const invalidFormData = {
      fullName: 'J', // Too short
      email: 'invalid-email',
      // age missing (required)
    };

    render(<FormRenderer
      {...defaultProps}
      formData={invalidFormData}
      onSubmit={onSubmit}
      onError={onError}
    />);

    const form = screen.getByText('Submit').closest('form');
    fireEvent.submit(form!);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ path: 'fullName' }),
      expect.objectContaining({ path: 'email' }),
      expect.objectContaining({ path: 'age' })
    ]));
  });

  it('should show progress indicator', () => {
    const partialData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      // age missing
    };

    render(<FormRenderer {...defaultProps} formData={partialData} showProgress={true} />);

    // Should show some kind of progress indication
    expect(screen.getByText(/Progress|Complete/)).toBeInTheDocument();
  });
});