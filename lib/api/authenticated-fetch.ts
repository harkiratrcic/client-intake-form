'use client';

/**
 * Client-side authenticated fetch wrapper
 * Automatically includes session token from cookies
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get session token from document cookies in browser
  const getSessionToken = (): string | null => {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const sessionCookie = cookies
      .find(cookie => cookie.trim().startsWith('session-token='));

    return sessionCookie ? sessionCookie.split('=')[1] : null;
  };

  const sessionToken = getSessionToken();

  const headers = new Headers(options.headers);

  // Add session token to Authorization header if available
  if (sessionToken) {
    headers.set('Authorization', `Bearer ${sessionToken}`);
  }

  // Ensure Content-Type is set for POST/PUT requests
  if (!headers.has('Content-Type') && (options.method === 'POST' || options.method === 'PUT')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Simplified authenticated API call methods
 */
export const api = {
  get: (url: string, options: RequestInit = {}) =>
    authenticatedFetch(url, { ...options, method: 'GET' }),

  post: (url: string, data?: any, options: RequestInit = {}) =>
    authenticatedFetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: any, options: RequestInit = {}) =>
    authenticatedFetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options: RequestInit = {}) =>
    authenticatedFetch(url, { ...options, method: 'DELETE' }),
};