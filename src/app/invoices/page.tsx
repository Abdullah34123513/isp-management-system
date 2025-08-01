'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, FileText, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';

interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  description?: string;
  createdAt: string;
  customer: {
    id: string;
    username: string;
    status: string;
  };
}

interface Customer {
  id: string;
  username: string;
  status: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add invoice');
      }

      setSuccess('Invoice added successfully!');
      setIsAddDialogOpen(false);
      setFormData({ customerId: '', amount: '', dueDate: '', description: '' });
      fetchInvoices();
    } catch (error) {
      console.error('Error adding invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to add invoice');
    } finally {
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string, reactivateCustomer = true) => {
    try {
      setIsActionLoading(invoiceId);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactivateCustomer })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark invoice as paid');
      }

      setSuccess('Invoice marked as paid successfully!');
      fetchInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      setError(error instanceof Error ? error.message : 'Failed to mark invoice as paid');
    } finally {
      setIsActionLoading(null);
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      setIsActionLoading(invoiceId);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete invoice');
      }

      setSuccess('Invoice deleted successfully!');
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete invoice');
    } finally {
      setIsActionLoading(null);
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, class: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', class: 'text-yellow-600' };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} days`, class: 'text-yellow-600' };
    } else {
      return { text: `${diffDays} days`, class: 'text-green-600' };
    }
  };

  const filteredInvoices = filterStatus === 'ALL' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Invoice Management
            </h1>
            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Invoices</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                      Generate a new invoice for a customer
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddInvoice}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="customerId" className="text-right">
                          Customer
                        </Label>
                        <Select
                          value={formData.customerId}
                          onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                          required
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          Amount
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="29.99"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dueDate" className="text-right">
                          Due Date
                        </Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Invoice description..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="col-span-3"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Invoice</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoices.length}</div>
                <p className="text-xs text-muted-foreground">
                  All invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {invoices.filter(i => i.status === 'PENDING').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {invoices.filter(i => i.status === 'OVERDUE').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {invoices.filter(i => i.status === 'PAID').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed payments
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                Manage customer invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.customer.username}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                {invoice.amount.toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div>{new Date(invoice.dueDate).toLocaleDateString()}</div>
                                <div className={`text-sm ${daysUntilDue.class}`}>
                                  {daysUntilDue.text}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell>
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {invoice.status === 'PENDING' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(invoice.id, true)}
                                    disabled={isActionLoading === invoice.id}
                                    title="Mark as paid"
                                  >
                                    {isActionLoading === invoice.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                {invoice.status === 'OVERDUE' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(invoice.id, true)}
                                    disabled={isActionLoading === invoice.id}
                                    title="Mark as paid and reactivate"
                                  >
                                    {isActionLoading === invoice.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  disabled={isActionLoading === invoice.id}
                                  title="Delete invoice"
                                >
                                  {isActionLoading === invoice.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {filterStatus === 'ALL' ? 'No invoices found.' : `No ${filterStatus.toLowerCase()} invoices found.`}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}