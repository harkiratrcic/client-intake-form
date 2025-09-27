import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Test database connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;

    // Check table existence
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    ` as Array<{ name: string }>;

    // Count records in key tables
    const [ownerCount, templateCount, sessionCount, instanceCount] = await Promise.all([
      prisma.owner.count().catch(() => 0),
      prisma.formTemplate.count().catch(() => 0),
      prisma.session.count().catch(() => 0),
      prisma.formInstance.count().catch(() => 0),
    ]);

    const responseTime = Date.now() - startTime;

    return successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        tables: tables.map(t => t.name),
        tableCount: tables.length,
        records: {
          owners: ownerCount,
          templates: templateCount,
          sessions: sessionCount,
          instances: instanceCount
        }
      },
      performance: {
        responseTimeMs: responseTime
      },
      checks: {
        databaseConnection: 'pass',
        tablesExist: tables.length >= 6 ? 'pass' : 'fail',
        hasOwners: ownerCount > 0 ? 'pass' : 'warn',
        hasTemplates: templateCount > 0 ? 'pass' : 'warn'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;

    console.error('Health check failed:', error);

    return errorResponse({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      },
      performance: {
        responseTimeMs: responseTime
      }
    }, 503);
  }
}