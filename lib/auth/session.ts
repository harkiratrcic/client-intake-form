import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';

export interface SessionPayload {
  ownerId: string;
  email: string;
  sessionId: string;
}

/**
 * Generate a secure session token using Web Crypto API
 */
export function generateSessionToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hash a session token for database storage using Web Crypto API
 */
export async function hashSessionToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a JWT token for the session
 */
export function createJWT(payload: SessionPayload): string {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: '30m',
    issuer: 'immigration-form-sender',
    audience: 'owner',
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWT(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret, {
      issuer: 'immigration-form-sender',
      audience: 'owner',
    }) as SessionPayload;

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate session expiry time
 */
export function getSessionExpiry(): Date {
  return new Date(Date.now() + config.auth.sessionExpiry);
}