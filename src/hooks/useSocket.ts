'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    // Connect to socket
    socket.connect();

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeToSessions = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe-sessions');
      socketRef.current.on('session-update', callback);
    }
  };

  const subscribeToCustomers = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe-customers');
      socketRef.current.on('customer-update', callback);
    }
  };

  const subscribeToInvoices = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe-invoices');
      socketRef.current.on('invoice-update', callback);
    }
  };

  const unsubscribeFromSessions = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('session-update', callback);
    }
  };

  const unsubscribeFromCustomers = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('customer-update', callback);
    }
  };

  const unsubscribeFromInvoices = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('invoice-update', callback);
    }
  };

  return {
    socket: socketRef.current,
    subscribeToSessions,
    subscribeToCustomers,
    subscribeToInvoices,
    unsubscribeFromSessions,
    unsubscribeFromCustomers,
    unsubscribeFromInvoices,
  };
};