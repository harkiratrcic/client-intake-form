import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FormPageClient } from '../form-client';

// Mock the auto-save hook
jest.mock('../../../../hooks/use-auto-save', () => ({
  useAutoSave: jest.fn(),
}));

// Mock the form renderer
jest.mock('../../../../components/form/form-renderer', () => ({
  FormRenderer: jest.fn(({ onChange, formData }) => (
    <div data-testid="form-renderer">
      <input
        data-testid="test-input"
        onChange={(e) => onChange({ ...formData, testField: e.target.value })}
      />
      <button type="submit">Submit</button>
    </div>
  )),
}));

import { useAutoSave } from '../../../../hooks/use-auto-save';

const mockUseAutoSave = useAutoSave as jest.MockedFunction<typeof useAutoSave>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('FormPageClient with Auto-Save', () => {
  const mockFormInstance = {
    id: 'form-1',
    token: 'test-token',
    status: 'draft' as const,
    formData: { initialField: 'initial value' },
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    template: {
      id: 'template-1',
      name: 'Test Form',
      schema: {
        type: 'object',
        properties: {
          testField: { type: 'string' }
        }
      }
    },
    owner: {
      id: 'owner-1',
      name: 'John Doe',
      email: 'john@example.com',
      rcicNumber: '12345'
    }
  };

  const mockAutoSave = {
    status: 'idle' as const,
    lastSaved: null,
    error: null,
    saveNow: jest.fn(),
    clearError: jest.fn(),
    getLocalData: jest.fn(),
    clearLocalData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAutoSave.mockReturnValue(mockAutoSave);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize auto-save hook with correct parameters', () => {
    render(<FormPageClient formInstance={mockFormInstance} />);

    expect(mockUseAutoSave).toHaveBeenCalledWith(
      mockFormInstance.formData,
      expect.any(Function),
      {
        delay: 2000,
        maxRetries: 3,
        enableLocalStorage: true,
        localStorageKey: 'form-draft-test-token',
      }
    );
  });

  it('should display saving status', () => {
    mockUseAutoSave.mockReturnValue({
      ...mockAutoSave,
      status: 'saving',
    });

    render(<FormPageClient formInstance={mockFormInstance} />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should display saved status with timestamp', () => {
    const lastSaved = new Date('2023-01-01T12:00:00.000Z');
    mockUseAutoSave.mockReturnValue({
      ...mockAutoSave,
      status: 'saved',
      lastSaved,
    });

    render(<FormPageClient formInstance={mockFormInstance} />);

    expect(screen.getByText(/Saved \d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('should display error status', () => {
    mockUseAutoSave.mockReturnValue({
      ...mockAutoSave,
      status: 'error',
      error: 'Network error',
    });

    render(<FormPageClient formInstance={mockFormInstance} />);

    expect(screen.getByText('Save failed')).toBeInTheDocument();
  });

  it('should call draft API when save function is invoked', async () => {
    let savedData: any = null;
    mockUseAutoSave.mockImplementation((data, saveFunction) => {
      savedData = data;
      // Simulate calling the save function
      saveFunction(data);
      return mockAutoSave;
    });

    render(<FormPageClient formInstance={mockFormInstance} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/forms/test-token/draft',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockFormInstance.formData),
        }
      );
    });
  });

  it('should not show auto-save status for expired forms', () => {
    const expiredFormInstance = {
      ...mockFormInstance,
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    };

    render(<FormPageClient formInstance={expiredFormInstance} />);

    expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
    expect(screen.queryByText('Save failed')).not.toBeInTheDocument();
    expect(screen.getByText('Form Expired')).toBeInTheDocument();
  });

  it('should not show auto-save status for completed forms', () => {
    const completedFormInstance = {
      ...mockFormInstance,
      status: 'submitted' as const,
    };

    render(<FormPageClient formInstance={completedFormInstance} />);

    expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
    expect(screen.queryByText('Save failed')).not.toBeInTheDocument();
    expect(screen.getByText('Form Already Submitted')).toBeInTheDocument();
  });

  it('should handle save function errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Draft save failed' }),
    } as Response);

    let saveFunction: ((data: any) => Promise<void>) | null = null;
    mockUseAutoSave.mockImplementation((data, sf) => {
      saveFunction = sf;
      return mockAutoSave;
    });

    render(<FormPageClient formInstance={mockFormInstance} />);

    if (saveFunction) {
      await expect(saveFunction(mockFormInstance.formData))
        .rejects
        .toThrow('Draft save failed');
    }
  });
});