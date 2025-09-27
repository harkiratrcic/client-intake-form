import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  businessName: z.string().min(1),
  rcicNumber: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    const { email, password, businessName, rcicNumber } = validation.data;

    // Check if email already exists
    const existingOwner = await prisma.owner.findUnique({
      where: { email }
    });

    if (existingOwner) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new owner
    const newOwner = await prisma.owner.create({
      data: {
        email,
        passwordHash,
        businessName,
        rcicNumber: rcicNumber || null,
      },
      select: {
        id: true,
        email: true,
        businessName: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      owner: newOwner
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}