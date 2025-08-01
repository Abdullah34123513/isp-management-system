import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    if (status) whereClause.status = status;

    const invoices = await db.invoice.findMany({
      where: whereClause,
      orderBy: { dueDate: 'asc' },
      include: {
        customer: {
          select: {
            id: true,
            username: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, amount, dueDate, description } = await request.json();

    if (!customerId || !amount || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if customer exists
    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const invoice = await db.invoice.create({
      data: {
        customerId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        description
      },
      include: {
        customer: {
          select: {
            id: true,
            username: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}