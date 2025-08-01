import { db } from '@/lib/db';
import { MikroTikClient } from '@/lib/mikrotik';

export async function checkOverdueInvoices() {
  try {
    console.log('Checking for overdue invoices...');
    
    // Get all overdue invoices
    const overdueInvoices = await db.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: new Date() // Due date is in the past
        }
      },
      include: {
        customer: {
          include: {
            router: true
          }
        }
      }
    });

    console.log(`Found ${overdueInvoices.length} overdue invoices`);

    for (const invoice of overdueInvoices) {
      // Mark invoice as overdue
      await db.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' }
      });

      // Suspend the customer if they're active
      if (invoice.customer.status === 'ACTIVE') {
        console.log(`Suspending customer ${invoice.customer.username} due to overdue invoice`);
        
        // Update customer status
        await db.customer.update({
          where: { id: invoice.customer.id },
          data: { status: 'SUSPENDED' }
        });

        // Sync with MikroTik
        try {
          const mikrotikClient = new MikroTikClient(invoice.customer.router);
          const secrets = await mikrotikClient.getPPPoESecrets();
          const secret = secrets.find(s => s.name === invoice.customer.username);
          
          if (secret) {
            await mikrotikClient.updatePPPoESecret(secret.id, {
              disabled: true
            });
          }

          // Disconnect active sessions
          const activeSessions = await mikrotikClient.getPPPoEActive();
          const session = activeSessions.find(s => s.name === invoice.customer.username);
          
          if (session) {
            await mikrotikClient.disconnectPPPoESession(session.id);
          }
        } catch (mikrotikError) {
          console.error(`Error suspending customer ${invoice.customer.username} on MikroTik:`, mikrotikError);
        }
      }
    }

    console.log('Overdue invoice check completed');
  } catch (error) {
    console.error('Error checking overdue invoices:', error);
  }
}

// Function to run the check every hour
export function startOverdueInvoiceChecker() {
  // Run immediately
  checkOverdueInvoices();
  
  // Then run every hour
  const interval = setInterval(checkOverdueInvoices, 60 * 60 * 1000);
  
  return () => clearInterval(interval);
}