import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { MikroTikClient } from '@/lib/mikrotik';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routerId = params.id;

    // Find the router
    const router = await db.router.findUnique({
      where: { id: routerId }
    });

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 });
    }

    // Create MikroTik client
    const mikrotikClient = new MikroTikClient(router);

    // Test connection and get status
    const connectionStatus = await mikrotikClient.getConnectionStatus();

    // Check if we're using real API or mock data
    if (!connectionStatus.usingRealAPI) {
      return NextResponse.json({ 
        error: 'Cannot sync: RouterOS API not available. Using mock data only.' 
      }, { status: 400 });
    }

    // Test connection
    if (!connectionStatus.connected) {
      return NextResponse.json({ 
        error: `Failed to connect to router: ${connectionStatus.message}` 
      }, { status: 400 });
    }

    // Fetch PPPoE secrets from router
    const secrets = await mikrotikClient.getPPPoESecrets();
    
    let syncedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;

    for (const secret of secrets) {
      // Check if customer already exists
      const existingCustomer = await db.customer.findUnique({
        where: { username: secret.name }
      });

      if (existingCustomer) {
        // Update existing customer
        await db.customer.update({
          where: { id: existingCustomer.id },
          data: {
            password: secret.password,
            status: secret.disabled ? 'SUSPENDED' : 'ACTIVE',
            routerId: router.id,
          }
        });
        updatedCount++;
      } else {
        // Create new customer
        await db.customer.create({
          data: {
            username: secret.name,
            password: secret.password,
            status: secret.disabled ? 'SUSPENDED' : 'ACTIVE',
            routerId: router.id,
          }
        });
        createdCount++;
      }
      syncedCount++;
    }

    // Update router sync timestamp
    await db.router.update({
      where: { id: router.id },
      data: { lastSync: new Date() }
    });

    return NextResponse.json({
      message: 'PPPoE users synced successfully',
      syncedCount,
      updatedCount,
      createdCount,
      lastSync: new Date()
    });

  } catch (error) {
    console.error('Error syncing PPPoE users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}