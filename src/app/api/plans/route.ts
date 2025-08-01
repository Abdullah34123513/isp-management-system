import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await db.plan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, price, billingCycle, rateLimit, profileName, description, isActive } = await request.json();

    if (!name || !price || !billingCycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if plan name already exists
    const existingPlan = await db.plan.findUnique({ where: { name } });
    if (existingPlan) {
      return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 });
    }

    const plan = await db.plan.create({
      data: {
        name,
        price: parseFloat(price),
        billingCycle,
        rateLimit,
        profileName,
        description,
        isActive: isActive ?? true
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}