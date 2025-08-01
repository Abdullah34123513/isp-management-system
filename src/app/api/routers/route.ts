import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { MikroTikClient } from '@/lib/mikrotik';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routers = await db.router.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            customers: true,
            activeSessions: true
          }
        }
      }
    });

    return NextResponse.json(routers);
  } catch (error) {
    console.error('Error fetching routers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { host, apiUser, apiPassword, label } = await request.json();

    if (!host || !apiUser || !apiPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Test connection to router
    const testRouter = {
      id: 'test',
      host,
      apiUser,
      encryptedApiPassword: apiPassword, // For testing, we'll use plain text
      label: label || host,
      lastSync: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mikrotikClient = new MikroTikClient(testRouter as any);
    const isConnected = await mikrotikClient.testConnection();

    if (!isConnected) {
      return NextResponse.json({ error: 'Failed to connect to router' }, { status: 400 });
    }

    // Encrypt the API password before storing
    const encryptedPassword = await bcrypt.hash(apiPassword, 12);

    // Create router in database
    const router = await db.router.create({
      data: {
        host,
        apiUser,
        encryptedApiPassword,
        label: label || host,
      }
    });

    // Sync PPPoE secrets from the router
    try {
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
      await db.router.update({
        where: { id: router.id },
        data: { lastSync: new Date() }
      });
    } catch (syncError) {
      console.error('Error syncing PPPoE secrets:', syncError);
      // Don't fail the router creation if sync fails
    }

    return NextResponse.json(router);
  } catch (error) {
    console.error('Error creating router:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}