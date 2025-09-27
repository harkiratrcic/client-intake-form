import crypto from 'crypto';

export interface TokenWithExpiry {
  token: string;
  expiresAt: Date;
}

export class TokenService {
  private readonly DEFAULT_EXPIRY_DAYS = 7;
  private readonly MAX_EXPIRY_DAYS = 30;
  private readonly MIN_TOKEN_LENGTH = 16;

  /**
   * Generate a cryptographically secure token for form access
   */
  generateFormToken(): string {
    // Generate 32 bytes of randomness for good entropy
    const randomBytes = crypto.randomBytes(32);

    // Convert to base64url format (URL-safe, no padding)
    return randomBytes.toString('base64url');
  }

  /**
   * Validate token format
   */
  validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Check minimum length
    if (token.length < this.MIN_TOKEN_LENGTH) {
      return false;
    }

    // Check base64url format (only alphanumeric, dash, and underscore)
    const base64urlPattern = /^[A-Za-z0-9_-]+$/;
    return base64urlPattern.test(token);
  }

  /**
   * Calculate expiry date based on days from now
   */
  calculateExpiry(days: number = this.DEFAULT_EXPIRY_DAYS): Date {
    // Enforce limits
    let expiryDays = Math.max(0.5, days); // Minimum 12 hours
    expiryDays = Math.min(expiryDays, this.MAX_EXPIRY_DAYS); // Maximum 30 days

    const now = new Date();
    const expiryTime = now.getTime() + (expiryDays * 24 * 60 * 60 * 1000);

    return new Date(expiryTime);
  }

  /**
   * Check if a date is expired (in the past)
   */
  isExpired(expiryDate: Date): boolean {
    const now = new Date();
    return expiryDate.getTime() <= now.getTime();
  }

  /**
   * Generate token with expiry date
   */
  generateTokenWithExpiry(days?: number): TokenWithExpiry {
    const token = this.generateFormToken();
    const expiresAt = this.calculateExpiry(days);

    return {
      token,
      expiresAt,
    };
  }

  /**
   * Get time remaining until expiry in milliseconds
   */
  getTimeUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    return Math.max(0, expiryDate.getTime() - now.getTime());
  }

  /**
   * Get time remaining until expiry in a human-readable format
   */
  getTimeUntilExpiryString(expiryDate: Date): string {
    const msRemaining = this.getTimeUntilExpiry(expiryDate);

    if (msRemaining <= 0) {
      return 'Expired';
    }

    const days = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Check if expiry is approaching (within 24 hours)
   */
  isExpiringSoon(expiryDate: Date): boolean {
    const msRemaining = this.getTimeUntilExpiry(expiryDate);
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return msRemaining > 0 && msRemaining <= twentyFourHours;
  }
}