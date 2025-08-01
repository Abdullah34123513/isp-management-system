import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { MikroTikClient } from '@/lib/mikrotik';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all routers
    const routers = await db.router.findMany({
      where: { isActive: true }
    });

    const allSessions = [];

    // Get active sessions from each router
    for (const router of routers) {
      try {
        const mikrotikClient = new MikroTikClient(router);
        const sessions = await mikrotikClient.getPPPoEActive();
        
        for (const session of sessions) {
          // Find customer by username
          const customer = await db.customer.findFirst({
            where: { 
              username: session.name,
              routerId: router.id
            }
          });

          allSessions.push({
            id: session.id,
            username: session.name,
            customerId: customer?.id,
            routerId: router.id,
            router: {
              id: router.id,
              host: router.host,
              label: router.label
            },
            ipAddress: session.address,
            uptime: session.uptime,
            bytesIn: session.bytesIn,
            bytesOut: session.bytesOut,
            connectedAt: new Date(Date.now() - parseUptime(session.uptime))
          });
        }
      } catch (error) {
        console.error(`Error fetching sessions from router ${router.host}:`, error);
        // Continue with other routers
      }
    }

    return NextResponse.json(allSessions);
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseUptime(uptime: string): number {
  // Parse uptime string like "2h30m" or "1d5h" to milliseconds
  const regex = /(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const match = uptime.match(regex);
  
  if (!match) return 0;
  
  const days = parseInt(match[1] || '0');
  const hours = parseInt(match[2] || '0');
  const minutes = parseInt(match[3] || '0');
  const seconds = parseInt(match[4] || '0');
  
  return (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000;
}