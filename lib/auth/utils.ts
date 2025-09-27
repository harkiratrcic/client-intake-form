import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Extract owner ID from request headers
 * In a real app, this would validate JWT tokens
 */
export function getOwnerFromRequest(request: NextRequest): string | null {
  // For now, using simple header-based authentication
  // In production, this would validate JWT tokens from cookies/headers
  return request.headers.get('x-owner-id');
}

/**
 * Validate that owner exists and is active
 */
export async function validateOwner(ownerId: string): Promise<boolean> {
  try {
    const owner = await prisma.owner.findFirst({
      where: {
        id: ownerId,
        isActive: true,
      },
    });

    return owner !== null;
  } catch (error) {
    console.error('Error validating owner:', error);
    return false;
  }
}