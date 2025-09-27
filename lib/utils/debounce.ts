/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Creates a debounced function that returns a promise which resolves with the result
 * of the debounced function call.
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeout: NodeJS.Timeout | null = null;
  let currentPromiseReject: ((reason?: any) => void) | null = null;

  return (...args: Parameters<T>) => {
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      // Cancel previous call if it exists
      if (timeout !== null) {
        clearTimeout(timeout);
        if (currentPromiseReject) {
          currentPromiseReject(new Error('Debounced call was cancelled'));
        }
      }

      currentPromiseReject = reject;

      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          timeout = null;
          currentPromiseReject = null;
        }
      }, wait);
    });
  };
}