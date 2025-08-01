import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { MikroTikClient } from '@/lib/mikrotik';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const router = await db.router.findUnique({
      where: { id: params.id },
      include: {
        customers: true,
        activeSessions: true
      }
    });

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 });
    }

    return NextResponse.json(router);
  } catch (error) {
    console.error('Error fetching router:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { host, apiUser, apiPassword, label, isActive } = await request.json();
    const router = await db.router.findUnique({ where: { id: params.id } });

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (host !== undefined) updateData.host = host;
    if (apiUser !== undefined) updateData.apiUser = apiUser;
    if (apiPassword !== undefined) {
      const bcrypt = require('bcryptjs');
      updateData.encryptedApiPassword = await bcrypt.hash(apiPassword, 12);
    }
    if (label !== undefined) updateData.label = label;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedRouter = await db.router.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(updatedRouter);
  } catch (error) {
    console.error('Error updating router:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const router = await db.router.findUnique({ where: { id: params.id } });

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 });
    }

    await db.router.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Router deleted successfully' });
  } catch (error) {
    console.error('Error deleting router:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const router = await db.router.findUnique({ where: { id: params.id } });

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 });
    }

    const mikrotikClient = new MikroTikClient(router);
    const isConnected = await mikrotikClient.testConnection();

    if (!isConnected) {
      return NextResponse.json({ error: 'Failed to connect to router' }, { status: 400 });
    }

    // Sync PPPoE secrets from the router
    const secrets = await mikrotikClient.getPPPoESecrets();
    
    for (const secret of secrets) {
      await db.customer.upsert({
        where: { username: secret.name },
        update: {
          password: secret.password,
          status: secret.disabled ? 'SUSPENDED' : 'ACTIVE',
          routerId: router.id,
        },
        create: {
          username: secret.name,
          password: secret.password,
          status: secret.disabled ? 'SUSPENDED' : 'ACTIVE',
          routerId: router.id,
        }
      });
    }

    // Update router sync timestamp
    const updatedRouter = await db.router.update({
      where: { id: router.id },
      data: { lastSync: new Date() }
    });

    return NextResponse.json({ 
      message: 'Router synced successfully',
      router: updatedRouter,
      syncedCustomers: secrets.length
    });
  } catch (error) {
    console.error('Error syncing router:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}