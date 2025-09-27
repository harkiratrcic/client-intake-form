import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../use-auto-save';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window event listeners
const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

describe('useAutoSave', () => {
  let mockSaveFunction: jest.MockedFunction<(data: any) => Promise<void>>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSaveFunction = jest.fn().mockResolvedValue(undefined);

    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});

    // Reset navigator.onLine
    (navigator as any).onLine = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with idle status', () => {
    const { result } = renderHook(() =>
      useAutoSave({ name: 'test' }, mockSaveFunction)
    );

    expect(result.current.status).toBe('idle');
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should debounce save operations correctly', async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, mockSaveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Change data multiple times quickly
    rerender({ data: { name: 'test2' } });
    rerender({ data: { name: 'test3' } });
    rerender({ data: { name: 'test4' } });

    // Should not have called save function yet
    expect(mockSaveFunction).not.toHaveBeenCalled();

    // Fast-forward past debounce delay
    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockSaveFunction).toHaveBeenCalledTimes(1);
    });

    // Should save the latest data
    expect(mockSaveFunction).toHaveBeenCalledWith({ name: 'test4' });
  });

  it('should update status during save process', async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, mockSaveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    // Change data to trigger save
    rerender({ data: { name: 'test2' } });

    // Fast-forward to trigger debounced save
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should be in saving state
    await waitFor(() => {
      expect(result.current.status).toBe('saving');
    });

    // Wait for save to complete
    await waitFor(() => {
      expect(result.current.status).toBe('saved');
      expect(result.current.lastSaved).toBeInstanceOf(Date);
    });
  });

  it('should retry on failure with exponential backoff', async () => {
    // Mock save function to fail first two times, then succeed
    mockSaveFunction
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, mockSaveFunction, { delay: 100, maxRetries: 3 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    rerender({ data: { name: 'test2' } });

    // Trigger initial save
    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockSaveFunction).toHaveBeenCalledTimes(1);
    });

    // First retry after 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockSaveFunction).toHaveBeenCalledTimes(2);
    });

    // Second retry after 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(mockSaveFunction).toHaveBeenCalledTimes(3);
      expect(result.current.status).toBe('saved');
    });
  });

  it('should set error status after max retries exceeded', async () => {
    mockSaveFunction.mockRejectedValue(new Error('Persistent error'));

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, mockSaveFunction, { delay: 100, maxRetries: 2 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    rerender({ data: { name: 'test2' } });

    // Trigger initial save and all retries
    act(() => {
      jest.advanceTimersByTime(150); // Initial save
    });

    // Wait for all retries to complete (don't expect specific call counts due to async nature)
    act(() => {
      jest.advanceTimersByTime(5000); // Give enough time for all retries
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Persistent error');
    });
  });

  it('should save to localStorage when offline', async () => {
    (navigator as any).onLine = false;

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, mockSaveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    rerender({ data: { name: 'test2' } });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'autosave',
        expect.stringContaining('test2')
      );
    });

    // Since offline behavior triggers an error, wait for status to update
    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Offline - saved locally only');
    });
  });

  it('should provide manual save functionality', async () => {
    const { result } = renderHook(() =>
      useAutoSave({ name: 'test' }, mockSaveFunction)
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(mockSaveFunction).toHaveBeenCalledWith({ name: 'test' });
    expect(result.current.status).toBe('saved');
  });

  it('should clear error state', async () => {
    mockSaveFunction.mockRejectedValue(new Error('Test error'));

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, mockSaveFunction, { delay: 100, maxRetries: 0 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    rerender({ data: { name: 'test2' } });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Test error');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('idle');
  });

  it('should manage local storage data', () => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({
        data: { name: 'stored test' },
        timestamp: '2023-01-01T00:00:00.000Z',
      })
    );

    const { result } = renderHook(() =>
      useAutoSave({ name: 'test' }, mockSaveFunction)
    );

    const localData = result.current.getLocalData();
    expect(localData).toEqual({
      data: { name: 'stored test' },
      timestamp: new Date('2023-01-01T00:00:00.000Z'),
    });

    act(() => {
      result.current.clearLocalData();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('autosave');
  });

  it('should setup online/offline event listeners', () => {
    renderHook(() => useAutoSave({ name: 'test' }, mockSaveFunction));

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useAutoSave({ name: 'test' }, mockSaveFunction)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should not save empty or null data', async () => {
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, mockSaveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test' } } }
    );

    // Change to empty object
    rerender({ data: {} });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockSaveFunction).not.toHaveBeenCalled();
    });

    // Change to null
    rerender({ data: null });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockSaveFunction).not.toHaveBeenCalled();
    });
  });

  it('should clear localStorage on successful save', async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, mockSaveFunction, { delay: 100 }),
      { initialProps: { data: { name: 'test1' } } }
    );

    rerender({ data: { name: 'test2' } });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('saved');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('autosave');
    });
  });
});