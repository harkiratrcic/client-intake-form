import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { debounce, debounceAsync } from '../debounce';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should reset delay on subsequent calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('test1');
    jest.advanceTimersByTime(50);

    debouncedFn('test2');
    jest.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledWith('test2');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should pass all arguments to the debounced function', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2', { key: 'value' });
    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
  });
});

describe('debounceAsync', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay async function execution', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    const debouncedFn = debounceAsync(mockFn, 100);

    const resultPromise = debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    const result = await resultPromise;
    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should cancel previous call when new call is made', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    const debouncedFn = debounceAsync(mockFn, 100);

    const firstPromise = debouncedFn('test1');
    jest.advanceTimersByTime(50);

    const secondPromise = debouncedFn('test2');

    // First promise should be rejected
    await expect(firstPromise).rejects.toThrow('Debounced call was cancelled');

    jest.advanceTimersByTime(100);

    // Second promise should resolve
    const result = await secondPromise;
    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalledWith('test2');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle rejected promises', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
    const debouncedFn = debounceAsync(mockFn, 100);

    const resultPromise = debouncedFn('test');
    jest.advanceTimersByTime(100);

    await expect(resultPromise).rejects.toThrow('Test error');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should pass all arguments to the async function', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    const debouncedFn = debounceAsync(mockFn, 100);

    const resultPromise = debouncedFn('arg1', 42, { key: 'value' });
    jest.advanceTimersByTime(100);

    await resultPromise;
    expect(mockFn).toHaveBeenCalledWith('arg1', 42, { key: 'value' });
  });

  it('should resolve with the correct return type', async () => {
    const mockFn = jest.fn().mockResolvedValue({ data: 'test', success: true });
    const debouncedFn = debounceAsync(mockFn, 100);

    const resultPromise = debouncedFn('test');
    jest.advanceTimersByTime(100);

    const result = await resultPromise;
    expect(result).toEqual({ data: 'test', success: true });
  });
});