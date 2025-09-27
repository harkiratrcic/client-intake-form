import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../auth-service';

describe('AuthService', () => {
  let prisma: PrismaClient;
  let authService: AuthService;
  let testOwnerId: string;

  beforeEach(async () => {
    prisma = new PrismaClient();
    authService = new AuthService(prisma);

    // Create test owner
    const owner = await prisma.owner.create({
      data: {
        email: 'test@rcic.ca',
        passwordHash: await require('bcryptjs').hash('TestPass123!', 10),
        businessName: 'Test Immigration Services',
        isActive: true,
      },
    });
    testOwnerId = owner.id;
  });

  afterEach(async () => {
    // Clean up
    await prisma.session.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.$disconnect();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const result = await authService.login('test@rcic.ca', 'TestPass123!');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.owner.email).toBe('test@rcic.ca');
        expect(result.session).toBeDefined();
        expect(result.session.token).toBeDefined();
      }
    });

    it('should reject invalid email', async () => {
      const result = await authService.login('wrong@email.com', 'TestPass123!');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid credentials');
      }
    });

    it('should reject invalid password', async () => {
      const result = await authService.login('test@rcic.ca', 'WrongPassword');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid credentials');
      }
    });

    it('should reject inactive owner', async () => {
      await prisma.owner.update({
        where: { id: testOwnerId },
        data: { isActive: false },
      });

      const result = await authService.login('test@rcic.ca', 'TestPass123!');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Account is inactive');
      }
    });

    it('should update lastLoginAt on successful login', async () => {
      const beforeLogin = new Date();
      await authService.login('test@rcic.ca', 'TestPass123!');

      const owner = await prisma.owner.findUnique({
        where: { id: testOwnerId },
      });

      expect(owner?.lastLoginAt).toBeDefined();
      expect(owner?.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('validateSession', () => {
    it('should validate valid session token', async () => {
      const loginResult = await authService.login('test@rcic.ca', 'TestPass123!');
      expect(loginResult.success).toBe(true);

      if (loginResult.success) {
        const validation = await authService.validateSession(loginResult.session.token);

        expect(validation.success).toBe(true);
        if (validation.success) {
          expect(validation.owner.id).toBe(testOwnerId);
        }
      }
    });

    it('should reject invalid session token', async () => {
      const validation = await authService.validateSession('invalid-token');

      expect(validation.success).toBe(false);
      if (!validation.success) {
        expect(validation.error).toBe('Invalid session');
      }
    });

    it('should reject expired session token', async () => {
      // Create expired session directly in DB
      const expiredSession = await prisma.session.create({
        data: {
          ownerId: testOwnerId,
          tokenHash: 'expired-hash',
          expiresAt: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      const validation = await authService.validateSession('expired-token');

      expect(validation.success).toBe(false);
      if (!validation.success) {
        expect(validation.error).toBe('Invalid session');
      }
    });
  });

  describe('logout', () => {
    it('should logout and invalidate session', async () => {
      const loginResult = await authService.login('test@rcic.ca', 'TestPass123!');
      expect(loginResult.success).toBe(true);

      if (loginResult.success) {
        const logoutResult = await authService.logout(loginResult.session.token);
        expect(logoutResult.success).toBe(true);

        // Session should be invalid now
        const validation = await authService.validateSession(loginResult.session.token);
        expect(validation.success).toBe(false);
      }
    });

    it('should handle logout of invalid token gracefully', async () => {
      const result = await authService.logout('invalid-token');
      expect(result.success).toBe(true); // Logout is idempotent
    });
  });
});