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

    const customer = await db.customer.findUnique({
      where: { id: params.id },
      include: {
        router: true,
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' }
        },
        activeSessions: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
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

    const { username, password, planId, status } = await request.json();
    const customer = await db.customer.findUnique({ 
      where: { id: params.id },
      include: { router: true }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.password = password;
    if (planId !== undefined) updateData.planId = planId;
    if (status !== undefined) updateData.status = status;

    const updatedCustomer = await db.customer.update({
      where: { id: params.id },
      data: updateData,
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

    // Sync with MikroTik if username or status changed
    if (username !== undefined || status !== undefined) {
      try {
        const mikrotikClient = new MikroTikClient(customer.router);
        
        // Find the PPPoE secret by username (we need to search for it)
        const secrets = await mikrotikClient.getPPPoESecrets();
        const secret = secrets.find(s => s.name === customer.username);
        
        if (secret) {
          await mikrotikClient.updatePPPoESecret(secret.id, {
            name: username || customer.username,
            disabled: status === 'SUSPENDED' || status === 'DISABLED'
          });
        }
      } catch (mikrotikError) {
        console.error('Error updating PPPoE secret on MikroTik:', mikrotikError);
        // Don't fail the customer update if MikroTik sync fails
      }
    }

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
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

    const customer = await db.customer.findUnique({ 
      where: { id: params.id },
      include: { router: true }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Remove PPPoE secret from MikroTik
    try {
      const mikrotikClient = new MikroTikClient(customer.router);
      const secrets = await mikrotikClient.getPPPoESecrets();
      const secret = secrets.find(s => s.name === customer.username);
      
      if (secret) {
        await mikrotikClient.removePPPoESecret(secret.id);
      }
    } catch (mikrotikError) {
      console.error('Error removing PPPoE secret from MikroTik:', mikrotikError);
      // Don't fail the customer deletion if MikroTik sync fails
    }

    await db.customer.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Suspend customer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json(); // 'suspend' or 'activate'
    const customer = await db.customer.findUnique({ 
      where: { id: params.id },
      include: { router: true }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
    
    // Update customer status
    const updatedCustomer = await db.customer.update({
      where: { id: params.id },
      data: { status: newStatus },
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

    // Sync with MikroTik
    try {
      const mikrotikClient = new MikroTikClient(customer.router);
      const secrets = await mikrotikClient.getPPPoESecrets();
      const secret = secrets.find(s => s.name === customer.username);
      
      if (secret) {
        await mikrotikClient.updatePPPoESecret(secret.id, {
          disabled: newStatus === 'SUSPENDED'
        });
      }

      // If suspending, disconnect active sessions
      if (action === 'suspend') {
        const activeSessions = await mikrotikClient.getPPPoEActive();
        const session = activeSessions.find(s => s.name === customer.username);
        
        if (session) {
          await mikrotikClient.disconnectPPPoESession(session.id);
        }
      }
    } catch (mikrotikError) {
      console.error('Error syncing with MikroTik:', mikrotikError);
      // Don't fail the customer status update if MikroTik sync fails
    }

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}