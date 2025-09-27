'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { debounceAsync } from '../lib/utils/debounce';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveOptions {
  /** Debounce delay in milliseconds (default: 2000) */
  delay?: number;
  /** Maximum retry attempts on failure (default: 3) */
  maxRetries?: number;
  /** Enable local storage backup (default: true) */
  enableLocalStorage?: boolean;
  /** Local storage key prefix (default: 'autosave') */
  localStorageKey?: string;
}

export interface AutoSaveResult {
  /** Current save status */
  status: SaveStatus;
  /** Last saved timestamp */
  lastSaved: Date | null;
  /** Last error message */
  error: string | null;
  /** Manually trigger save */
  saveNow: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Get locally stored data */
  getLocalData: () => any;
  /** Clear locally stored data */
  clearLocalData: () => void;
}

/**
 * Auto-save hook that debounces save operations and handles network failures
 */
export function useAutoSave(
  data: any,
  saveFunction: (data: any) => Promise<void>,
  options: AutoSaveOptions = {}
): AutoSaveResult {
  const {
    delay = 2000,
    maxRetries = 3,
    enableLocalStorage = true,
    localStorageKey = 'autosave',
  } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const retryCountRef = useRef(0);
  const lastDataRef = useRef(data);
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to local storage
  const saveToLocalStorage = useCallback((data: any) => {
    if (!enableLocalStorage || typeof window === 'undefined') return;

    try {
      const storageData = {
        data,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(localStorageKey, JSON.stringify(storageData));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [enableLocalStorage, localStorageKey]);

  // Get from local storage
  const getLocalData = useCallback(() => {
    if (!enableLocalStorage || typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(localStorageKey);
      if (!stored) return null;

      const { data, timestamp } = JSON.parse(stored);
      return { data, timestamp: new Date(timestamp) };
    } catch (error) {
      console.warn('Failed to retrieve from localStorage:', error);
      return null;
    }
  }, [enableLocalStorage, localStorageKey]);

  // Clear local storage
  const clearLocalData = useCallback(() => {
    if (!enableLocalStorage || typeof window === 'undefined') return;

    try {
      localStorage.removeItem(localStorageKey);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, [enableLocalStorage, localStorageKey]);

  // Perform save with retry logic
  const performSave = useCallback(async (data: any): Promise<void> => {
    if (!navigator.onLine) {
      // If offline, just save to local storage
      saveToLocalStorage(data);
      throw new Error('Offline - saved locally only');
    }

    setStatus('saving');
    setError(null);

    try {
      await saveFunction(data);
      setStatus('saved');
      setLastSaved(new Date());
      retryCountRef.current = 0;

      // Clear local storage on successful save
      if (enableLocalStorage) {
        clearLocalData();
      }
    } catch (error) {
      // Save to local storage as backup
      saveToLocalStorage(data);

      retryCountRef.current += 1;
      const errorMessage = error instanceof Error ? error.message : 'Save failed';

      if (retryCountRef.current <= maxRetries) {
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, retryCountRef.current - 1) * 1000;
        setTimeout(() => {
          performSave(data);
        }, retryDelay);
        return;
      }

      // Max retries exceeded
      setStatus('error');
      setError(errorMessage);
      retryCountRef.current = 0;
      throw error;
    }
  }, [saveFunction, maxRetries, saveToLocalStorage, clearLocalData, enableLocalStorage]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounceAsync(performSave, delay),
    [performSave, delay]
  );

  // Auto-save when data changes
  useEffect(() => {
    // Don't save on initial render
    if (lastDataRef.current === data) return;

    lastDataRef.current = data;

    // Don't auto-save empty or null data
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return;
    }

    debouncedSave(data).catch(() => {
      // Error handling is already done in performSave
    });
  }, [data, debouncedSave]);

  // Manual save function
  const saveNow = useCallback(async (): Promise<void> => {
    return performSave(data);
  }, [data, performSave]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  return {
    status,
    lastSaved,
    error,
    saveNow,
    clearError,
    getLocalData,
    clearLocalData,
  };
}