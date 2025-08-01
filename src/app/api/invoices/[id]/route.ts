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

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: {
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
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
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

    const { amount, dueDate, description, status } = await request.json();
    const invoice = await db.invoice.findUnique({ 
      where: { id: params.id },
      include: { customer: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const updatedInvoice = await db.invoice.update({
      where: { id: params.id },
      data: updateData,
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

    // If invoice is marked as paid, check if customer should be reactivated
    if (status === 'PAID' && invoice.customer.status === 'SUSPENDED') {
      // Check if customer has other overdue invoices
      const overdueInvoices = await db.invoice.count({
        where: {
          customerId: invoice.customerId,
          status: 'OVERDUE'
        }
      });

      if (overdueInvoices === 0) {
        // Reactivate customer
        await db.customer.update({
          where: { id: invoice.customerId },
          data: { status: 'ACTIVE' }
        });
      }
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
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

    const invoice = await db.invoice.findUnique({ where: { id: params.id } });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await db.invoice.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mark invoice as paid
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reactivateCustomer } = await request.json();
    const invoice = await db.invoice.findUnique({ 
      where: { id: params.id },
      include: { customer: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Mark invoice as paid
    const updatedInvoice = await db.invoice.update({
      where: { id: params.id },
      data: { status: 'PAID' },
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

    // Reactivate customer if requested and no other overdue invoices
    if (reactivateCustomer && invoice.customer.status === 'SUSPENDED') {
      const overdueInvoices = await db.invoice.count({
        where: {
          customerId: invoice.customerId,
          status: 'OVERDUE'
        }
      });

      if (overdueInvoices === 0) {
        await db.customer.update({
          where: { id: invoice.customerId },
          data: { status: 'ACTIVE' }
        });
      }
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}