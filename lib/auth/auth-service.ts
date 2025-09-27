import { PrismaClient, Owner } from '@prisma/client';
import { verifyPassword } from './password';
import {
  generateSessionToken,
  hashSessionToken,
  createJWT,
  verifyJWT,
  getSessionExpiry,
  SessionPayload
} from './session';

export type LoginResult = {
  success: true;
  owner: Owner;
  session: {
    token: string;
    jwt: string;
  };
} | {
  success: false;
  error: string;
}

export type ValidationResult = {
  success: true;
  owner: Owner;
  session: {
    id: string;
    token: string;
  };
} | {
  success: false;
  error: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Authenticate owner and create session
   */
  async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    try {
      // Find owner by email
      const owner = await this.prisma.owner.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!owner) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is active
      if (!owner.isActive) {
        return { success: false, error: 'Account is inactive' };
      }

      // Verify password
      const passwordValid = await verifyPassword(password, owner.passwordHash);
      if (!passwordValid) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Generate session token
      const sessionToken = generateSessionToken();
      const tokenHash = await hashSessionToken(sessionToken);

      // Create session in database
      const session = await this.prisma.session.create({
        data: {
          ownerId: owner.id,
          tokenHash,
          expiresAt: getSessionExpiry(),
          ipAddress,
          userAgent,
        },
      });

      // Create JWT payload
      const jwtPayload: SessionPayload = {
        ownerId: owner.id,
        email: owner.email,
        sessionId: session.id,
      };

      // Create JWT token
      const jwt = createJWT(jwtPayload);

      // Update last login time
      await this.prisma.owner.update({
        where: { id: owner.id },
        data: { lastLoginAt: new Date() },
      });

      return {
        success: true,
        owner,
        session: {
          token: sessionToken,
          jwt,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Validate session token and return owner
   */
  async validateSession(sessionToken: string): Promise<ValidationResult> {
    try {
      console.log('🔍 Validating session token:', sessionToken.substring(0, 10) + '...');
      const tokenHash = await hashSessionToken(sessionToken);
      console.log('🔑 Token hash:', tokenHash.substring(0, 16) + '...');

      // Find session with owner
      const session = await this.prisma.session.findUnique({
        where: { tokenHash },
        include: { owner: true },
      });

      console.log('📊 Session found:', !!session);
      if (!session) {
        // Debug: Check all sessions
        const allSessions = await this.prisma.session.findMany({
          select: { id: true, tokenHash: true, expiresAt: true }
        });
        console.log('🗃️ All sessions in DB:', allSessions.length);
        console.log('🔍 Looking for hash:', tokenHash);
        console.log('📋 Available hashes:', allSessions.map(s => s.tokenHash.substring(0, 16) + '...'));
        return { success: false, error: 'Invalid session' };
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        // Clean up expired session
        await this.prisma.session.delete({
          where: { id: session.id },
        });
        return { success: false, error: 'Session expired' };
      }

      // Check if owner is still active
      if (!session.owner.isActive) {
        return { success: false, error: 'Account is inactive' };
      }

      // Update last activity
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastActivityAt: new Date() },
      });

      return {
        success: true,
        owner: session.owner,
        session: {
          id: session.id,
          token: sessionToken,
        },
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { success: false, error: 'Invalid session' };
    }
  }

  /**
   * Logout and invalidate session
   */
  async logout(sessionToken: string): Promise<LogoutResult> {
    try {
      const tokenHash = await hashSessionToken(sessionToken);

      // Delete session from database
      await this.prisma.session.deleteMany({
        where: { tokenHash },
      });

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: true }; // Logout is idempotent
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Session cleanup error:', error);
      return 0;
    }
  }
}