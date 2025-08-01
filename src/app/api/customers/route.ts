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

    const customers = await db.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        router: {
          select: {
            id: true,
            host: true,
            label: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            billingCycle: true
          }
        },
        _count: {
          select: {
            invoices: true,
            activeSessions: true
          }
        }
      }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, password, planId, routerId } = await request.json();

    if (!username || !password || !routerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if router exists
    const router = await db.router.findUnique({ where: { id: routerId } });
    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 });
    }

    // Check if plan exists if provided
    if (planId) {
      const plan = await db.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }
    }

    // Check if username already exists
    const existingCustomer = await db.customer.findUnique({ where: { username } });
    if (existingCustomer) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    // Create PPPoE secret on MikroTik
    const mikrotikClient = new MikroTikClient(router);
    
    try {
      await mikrotikClient.addPPPoESecret({
        name: username,
        password,
        service: 'pppoe',
        profile: planId ? (await db.plan.findUnique({ where: { id: planId } }))?.profileName || 'default' : 'default',
        remoteAddress: '',
        disabled: false
      });
    } catch (mikrotikError) {
      console.error('Error creating PPPoE secret on MikroTikik:', mikrotikError);
      return NextResponse.json({ error: 'Failed to create PPPoE secret on router' }, { status: 500 });
    }

    // Create customer in database
    const customer = await db.customer.create({
      data: {
        username,
        password,
        planId,
        routerId,
        status: 'ACTIVE'
      },
      include: {
        router: {
          select: {
            id: true,
            host: true,
            label: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            billingCycle: true
          }
        }
      }
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}