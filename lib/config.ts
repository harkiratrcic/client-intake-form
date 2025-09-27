interface Config {
  database: {
    url: string;
  };
  app: {
    url: string;
    port: number;
    env: string;
  };
  auth: {
    jwtSecret: string;
    sessionExpiry: number;
  };
  email: {
    resendApiKey?: string;
    fromAddress: string;
  };
}

function validateEnv(): Config {
  const env = process.env;
  const nodeEnv = env.NODE_ENV || 'development';

  // Required environment variables
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  // JWT_SECRET is required in production
  if (nodeEnv === 'production' && !env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
  }

  // NEXT_PUBLIC_APP_URL defaults to localhost in development
  const appUrl = env.NEXT_PUBLIC_APP_URL ||
    (nodeEnv === 'development' ? 'http://localhost:3000' : '');

  if (!appUrl && nodeEnv === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL is required in production');
  }

  return {
    database: {
      url: env.DATABASE_URL,
    },
    app: {
      url: appUrl,
      port: parseInt(env.PORT || '3000', 10),
      env: nodeEnv,
    },
    auth: {
      jwtSecret: env.JWT_SECRET || 'dev-secret-change-in-production',
      sessionExpiry: 30 * 60 * 1000, // 30 minutes in milliseconds
    },
    email: {
      resendApiKey: env.RESEND_API_KEY,
      fromAddress: env.EMAIL_FROM || 'noreply@example.com',
    },
  };
}

// Validate environment on module load
export const config = validateEnv();

// Export type for use in other modules
export type AppConfig = typeof config;