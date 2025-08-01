import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join the admin room for real-time updates
    socket.join('admin-updates');
    
    // Handle session updates
    socket.on('subscribe-sessions', () => {
      socket.join('sessions');
      console.log('Client subscribed to session updates');
    });

    // Handle customer updates
    socket.on('subscribe-customers', () => {
      socket.join('customers');
      console.log('Client subscribed to customer updates');
    });

    // Handle invoice updates
    socket.on('subscribe-invoices', () => {
      socket.join('invoices');
      console.log('Client subscribed to invoice updates');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to ISP Management System',
      timestamp: new Date().toISOString(),
    });
  });
};

// Helper functions to broadcast updates
export const broadcastSessionUpdate = (io: Server, data: any) => {
  io.to('sessions').emit('session-update', data);
};

export const broadcastCustomerUpdate = (io: Server, data: any) => {
  io.to('customers').emit('customer-update', data);
};

export const broadcastInvoiceUpdate = (io: Server, data: any) => {
  io.to('invoices').emit('invoice-update', data);
};