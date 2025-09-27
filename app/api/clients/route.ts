import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    // TEMP: Skip authentication for testing
    console.log('🚀 Fetching clients - skipping auth for testing');
    // const sessionResult = await getSession(request);
    // if (!sessionResult.success) {
    //   return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    // }

    // Get owner from database for testing
    const testOwner = await prisma.owner.findFirst({
      where: { email: 'owner@test.com' }
    });
    if (!testOwner) {
      return NextResponse.json({ error: 'Test owner not found' }, { status: 500 });
    }

    // Get all clients for this owner
    const clients = await prisma.client.findMany({
      where: {
        ownerId: testOwner.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      clients,
      count: clients.length,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // TEMP: Skip authentication for testing
    console.log('🚀 Creating client - skipping auth for testing');
    // const sessionResult = await getSession(request);
    // if (!sessionResult.success) {
    //   return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    // }

    // Get owner from database for testing
    const testOwner = await prisma.owner.findFirst({
      where: { email: 'owner@test.com' }
    });
    if (!testOwner) {
      return NextResponse.json({ error: 'Test owner not found' }, { status: 500 });
    }

    // Parse request body
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      nationality,
      passportNumber,
      currentStatus,
      address,
      city,
      province,
      postalCode,
      country,
      notes,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if client with this email already exists for this owner
    const existingClient = await prisma.client.findFirst({
      where: {
        ownerId: testOwner.id,
        email,
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      );
    }

    // Create the client
    const client = await prisma.client.create({
      data: {
        ownerId: testOwner.id,
        firstName,
        lastName,
        email,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality: nationality || null,
        passportNumber: passportNumber || null,
        currentStatus: currentStatus || null,
        address: address || null,
        city: city || null,
        province: province || null,
        postalCode: postalCode || null,
        country: country || null,
        notes: notes || null,
      },
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        entityType: 'client',
        entityId: client.id,
        action: 'client_created',
        actorType: 'OWNER',
        actorId: testOwner.id,
        ipAddress: request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown',
        userAgent: request.headers.get('user-agent'),
        metadata: {
          clientEmail: email,
          clientName: `${firstName} ${lastName}`,
        },
      },
    });

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get session for authentication
    const sessionResult = await getSession(request);
    if (!sessionResult.success) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if client exists and belongs to this owner
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        ownerId: sessionResult.owner.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Process dateOfBirth if provided
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Update the client
    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        entityType: 'client',
        entityId: id,
        action: 'client_updated',
        actorType: 'OWNER',
        actorId: sessionResult.owner.id,
        ipAddress: request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown',
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      client: updatedClient,
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get session for authentication
    const sessionResult = await getSession(request);
    if (!sessionResult.success) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get client ID from query params
    const url = new URL(request.url);
    const clientId = url.searchParams.get('id');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if client exists and belongs to this owner
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        ownerId: sessionResult.owner.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Delete the client
    await prisma.client.delete({
      where: { id: clientId },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        entityType: 'client',
        entityId: clientId,
        action: 'client_deleted',
        actorType: 'OWNER',
        actorId: sessionResult.owner.id,
        ipAddress: request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown',
        userAgent: request.headers.get('user-agent'),
        metadata: {
          clientEmail: existingClient.email,
          clientName: `${existingClient.firstName} ${existingClient.lastName}`,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}