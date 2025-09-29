import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting database debug check...');

    // Basic security check
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check database status
    const [templateCount, ownerCount, formInstanceCount] = await Promise.all([
      prisma.formTemplate.count(),
      prisma.owner.count(),
      prisma.formInstance.count(),
    ]);

    // Get sample data
    const templates = await prisma.formTemplate.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true
      },
      take: 5
    });

    const formInstances = await prisma.formInstance.findMany({
      select: {
        id: true,
        secureToken: true,
        clientEmail: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        templateId: true
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const owners = await prisma.owner.findMany({
      select: {
        id: true,
        email: true,
        businessName: true,
        isActive: true,
        createdAt: true
      },
      take: 5
    });

    console.log('📊 Database status retrieved successfully');

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        counts: {
          templates: templateCount,
          owners: ownerCount,
          formInstances: formInstanceCount
        },
        sampleData: {
          templates,
          formInstances,
          owners
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
        jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
      }
    });

  } catch (error) {
    console.error('❌ Debug check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Database debug check failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}