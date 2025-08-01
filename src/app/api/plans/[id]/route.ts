import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await db.plan.findUnique({
      where: { id: params.id },
      include: {
        customers: {
          select: {
            id: true,
            username: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            customers: true
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
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

    const { name, price, billingCycle, rateLimit, profileName, description, isActive } = await request.json();
    const plan = await db.plan.findUnique({ where: { id: params.id } });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) {
      // Check if new name conflicts with existing plan
      if (name !== plan.name) {
        const existingPlan = await db.plan.findUnique({ where: { name } });
        if (existingPlan) {
          return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 });
        }
      }
      updateData.name = name;
    }
    if (price !== undefined) updateData.price = parseFloat(price);
    if (billingCycle !== undefined) updateData.billingCycle = billingCycle;
    if (rateLimit !== undefined) updateData.rateLimit = rateLimit;
    if (profileName !== undefined) updateData.profileName = profileName;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPlan = await db.plan.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
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

    const plan = await db.plan.findUnique({ 
      where: { id: params.id },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if plan has customers
    if (plan._count.customers > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete plan with associated customers' 
      }, { status: 400 });
    }

    await db.plan.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}