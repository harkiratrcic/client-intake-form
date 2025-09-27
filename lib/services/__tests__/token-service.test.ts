import { describe, expect, it } from '@jest/globals';
import { TokenService } from '../token-service';

describe('TokenService', () => {
  const tokenService = new TokenService();

  describe('generateFormToken', () => {
    it('should generate unique tokens', () => {
      const token1 = tokenService.generateFormToken();
      const token2 = tokenService.generateFormToken();

      expect(token1).not.toBe(token2);
      expect(typeof token1).toBe('string');
      expect(typeof token2).toBe('string');
    });

    it('should generate tokens of expected format', () => {
      const token = tokenService.generateFormToken();

      // Should be base64url format (no special characters)
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);

      // Should be at least 32 characters long (good entropy)
      expect(token.length).toBeGreaterThanOrEqual(32);
    });

    it('should generate sufficiently random tokens', () => {
      // Generate multiple tokens to check randomness
      const tokens = new Set();
      const count = 100;

      for (let i = 0; i < count; i++) {
        tokens.add(tokenService.generateFormToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(count);
    });
  });

  describe('validateTokenFormat', () => {
    it('should validate well-formed tokens', () => {
      const token = tokenService.generateFormToken();
      const isValid = tokenService.validateTokenFormat(token);

      expect(isValid).toBe(true);
    });

    it('should reject empty strings', () => {
      const isValid = tokenService.validateTokenFormat('');
      expect(isValid).toBe(false);
    });

    it('should reject tokens with invalid characters', () => {
      const invalidTokens = [
        'token with spaces',
        'token+with/special=chars',
        'token@with#symbols',
        'token.with.dots',
      ];

      invalidTokens.forEach(token => {
        const isValid = tokenService.validateTokenFormat(token);
        expect(isValid).toBe(false);
      });
    });

    it('should reject very short tokens', () => {
      const shortToken = 'abc123';
      const isValid = tokenService.validateTokenFormat(shortToken);
      expect(isValid).toBe(false);
    });

    it('should accept valid base64url tokens', () => {
      const validTokens = [
        'abcdef123456_-ABCDEF',
        'VGVzdFRva2VuMTIzNDU2Nzg5MA',
        'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        'Token_With-Valid_Characters123',
      ];

      validTokens.forEach(token => {
        const isValid = tokenService.validateTokenFormat(token);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('calculateExpiry', () => {
    it('should calculate expiry correctly', () => {
      const days = 7;
      const now = new Date();
      const expiry = tokenService.calculateExpiry(days);

      // Should be approximately 7 days from now (allowing for test execution time)
      const expectedExpiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(expiry.getTime() - expectedExpiry.getTime());

      // Allow 1 second difference for test execution
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should handle different day values', () => {
      const testCases = [1, 3, 7, 14, 30];
      const now = new Date();

      testCases.forEach(days => {
        const expiry = tokenService.calculateExpiry(days);
        const expectedMillis = days * 24 * 60 * 60 * 1000;
        const actualDiff = expiry.getTime() - now.getTime();

        // Allow 1 second tolerance
        expect(Math.abs(actualDiff - expectedMillis)).toBeLessThan(1000);
      });
    });

    it('should handle edge cases', () => {
      // Minimum 1 day
      const minExpiry = tokenService.calculateExpiry(0.5);
      const now = new Date();
      const timeDiff = minExpiry.getTime() - now.getTime();
      expect(timeDiff).toBeGreaterThan(0.4 * 24 * 60 * 60 * 1000); // At least ~12 hours

      // Maximum allowed
      const maxExpiry = tokenService.calculateExpiry(100);
      const maxTimeDiff = maxExpiry.getTime() - now.getTime();
      expect(maxTimeDiff).toBeLessThanOrEqual(31 * 24 * 60 * 60 * 1000); // Max 30 days
    });
  });

  describe('isExpired', () => {
    it('should correctly identify expired dates', () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const isExpired = tokenService.isExpired(pastDate);
      expect(isExpired).toBe(true);
    });

    it('should correctly identify non-expired dates', () => {
      const futureDate = new Date(Date.now() + 1000); // 1 second from now
      const isExpired = tokenService.isExpired(futureDate);
      expect(isExpired).toBe(false);
    });

    it('should handle edge cases around current time', () => {
      const now = new Date();
      const almostNow = new Date(now.getTime() - 1); // 1ms ago

      // Should be expired (even by 1ms)
      expect(tokenService.isExpired(almostNow)).toBe(true);

      const justFuture = new Date(now.getTime() + 1); // 1ms from now
      expect(tokenService.isExpired(justFuture)).toBe(false);
    });
  });

  describe('generateTokenWithExpiry', () => {
    it('should generate token and expiry together', () => {
      const days = 7;
      const result = tokenService.generateTokenWithExpiry(days);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(typeof result.token).toBe('string');
      expect(result.expiresAt instanceof Date).toBe(true);
      expect(tokenService.validateTokenFormat(result.token)).toBe(true);
    });

    it('should use default expiry when not specified', () => {
      const result = tokenService.generateTokenWithExpiry();
      const now = new Date();

      // Default should be 7 days
      const expectedExpiry = 7 * 24 * 60 * 60 * 1000;
      const actualDiff = result.expiresAt.getTime() - now.getTime();

      expect(Math.abs(actualDiff - expectedExpiry)).toBeLessThan(1000);
    });

    it('should respect custom expiry days', () => {
      const customDays = 14;
      const result = tokenService.generateTokenWithExpiry(customDays);
      const now = new Date();

      const expectedExpiry = customDays * 24 * 60 * 60 * 1000;
      const actualDiff = result.expiresAt.getTime() - now.getTime();

      expect(Math.abs(actualDiff - expectedExpiry)).toBeLessThan(1000);
    });
  });
});