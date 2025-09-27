import { describe, expect, it } from '@jest/globals';
import { hashPassword, verifyPassword } from '../password';

describe('Password Utility', () => {
  const testPassword = 'TestPassword123!';
  const wrongPassword = 'WrongPassword456!';

  it('should hash password correctly', async () => {
    const hash = await hashPassword(testPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(testPassword);
    expect(hash.length).toBeGreaterThan(20);
    expect(hash.startsWith('$2')).toBe(true); // bcrypt hash format
  });

  it('should verify correct password', async () => {
    const hash = await hashPassword(testPassword);
    const isValid = await verifyPassword(testPassword, hash);

    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hash = await hashPassword(testPassword);
    const isValid = await verifyPassword(wrongPassword, hash);

    expect(isValid).toBe(false);
  });

  it('should generate different hashes for same password', async () => {
    const hash1 = await hashPassword(testPassword);
    const hash2 = await hashPassword(testPassword);

    expect(hash1).not.toBe(hash2);

    // But both should verify correctly
    expect(await verifyPassword(testPassword, hash1)).toBe(true);
    expect(await verifyPassword(testPassword, hash2)).toBe(true);
  });

  it('should handle empty password', async () => {
    const hash = await hashPassword('');
    expect(hash).toBeDefined();
    expect(await verifyPassword('', hash)).toBe(true);
  });
});