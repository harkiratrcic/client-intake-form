import { describe, expect, it, beforeEach } from '@jest/globals';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure fresh import
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate required environment variables exist', () => {
    // Set required env vars for testing
    process.env.DATABASE_URL = 'postgresql://test';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';

    const { config } = require('../config');

    expect(config.database.url).toBe('postgresql://test');
    expect(config.app.url).toBe('http://localhost:3000');
    expect(config.auth.jwtSecret).toBe('test-secret');
    expect(config.app.env).toBe('test');
  });

  it('should throw error when required DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => {
      require('../config');
    }).toThrow('DATABASE_URL is required');
  });

  it('should throw error when required JWT_SECRET is missing in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://test';
    delete process.env.JWT_SECRET;

    expect(() => {
      require('../config');
    }).toThrow('JWT_SECRET is required in production');
  });

  it('should use default values for optional variables', () => {
    process.env.DATABASE_URL = 'postgresql://test';
    process.env.JWT_SECRET = 'test';

    const { config } = require('../config');

    expect(config.app.port).toBe(3000);
    expect(config.app.env).toBe('test');
  });

  it('should provide typed access to all config values', () => {
    process.env.DATABASE_URL = 'postgresql://test';
    process.env.JWT_SECRET = 'test';
    process.env.RESEND_API_KEY = 'resend_test';

    const { config } = require('../config');

    // Type checking - these should all exist
    expect(config.database).toBeDefined();
    expect(config.app).toBeDefined();
    expect(config.auth).toBeDefined();
    expect(config.email).toBeDefined();
  });
});