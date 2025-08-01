'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, UserPlus, UserX, Pause, Play, Edit, Trash2, Search } from 'lucide-react';

interface Customer {
  id: string;
  username: string;
  status: string;
  createdAt: string;
  router: {
    id: string;
    host: string;
    label: string;
  };
  plan?: {
    id: string;
    name: string;
    price: number;
    billingCycle: string;
  };
  _count: {
    invoices: number;
    activeSessions: number;
  };
}

interface Router {
  id: string;
  host: string;
  label: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [routers, setRouters] = useState<Router[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    planId: '',
    routerId: ''
  });

  useEffect(() => {
    fetchCustomers();
    fetchRouters();
    fetchPlans();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchRouters = async () => {
    try {
      const response = await fetch('/api/routers');
      if (!response.ok) throw new Error('Failed to fetch routers');
      const data = await response.json();
      setRouters(data.filter((r: Router) => r.isActive));
    } catch (error) {
      console.error('Error fetching routers:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data.filter((p: Plan) => p.isActive));
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add customer');
      }

      setSuccess('Customer added successfully!');
      setIsAddDialogOpen(false);
      setFormData({ username: '', password: '', planId: '', routerId: '' });
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      setError(error instanceof Error ? error.message : 'Failed to add customer');
    } finally {
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleCustomerAction = async (customerId: string, action: 'suspend' | 'activate') => {
    try {
      setIsActionLoading(customerId);
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} customer`);
      }

      setSuccess(`Customer ${action}d successfully!`);
      fetchCustomers();
    } catch (error) {
      console.error(`Error ${action}ing customer:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${action} customer`);
    } finally {
      setIsActionLoading(null);
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      setIsActionLoading(customerId);
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      setSuccess('Customer deleted successfully!');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete customer');
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
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'DISABLED':
        return <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Customer Management
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                      Create a new PPPoE customer account
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCustomer}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                          Username
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="routerId" className="text-right">
                          Router
                        </Label>
                        <Select
                          value={formData.routerId}
                          onValueChange={(value) => setFormData({ ...formData, routerId: value })}
                          required
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select router" />
                          </SelectTrigger>
                          <SelectContent>
                            {routers.map((router) => (
                              <SelectItem key={router.id} value={router.id}>
                                {router.label || router.host}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="planId" className="text-right">
                          Plan
                        </Label>
                        <Select
                          value={formData.planId}
                          onValueChange={(value) => setFormData({ ...formData, planId: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select plan (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} - ${plan.price}/{plan.billingCycle.toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Customer</Button>
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

          <Card>
            <CardHeader>
              <CardTitle>Customer Accounts</CardTitle>
              <CardDescription>
                Manage PPPoE customer accounts and their access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Router</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Invoices</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.username}</TableCell>
                          <TableCell>{getStatusBadge(customer.status)}</TableCell>
                          <TableCell>
                            {customer.plan ? (
                              <div>
                                <div className="font-medium">{customer.plan.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  ${customer.plan.price}/{customer.plan.billingCycle.toLowerCase()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No Plan</span>
                            )}
                          </TableCell>
                          <TableCell>{customer.router.label || customer.router.host}</TableCell>
                          <TableCell>{customer._count.activeSessions}</TableCell>
                          <TableCell>{customer._count.invoices}</TableCell>
                          <TableCell>
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {customer.status === 'ACTIVE' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCustomerAction(customer.id, 'suspend')}
                                  disabled={isActionLoading === customer.id}
                                  title="Suspend customer"
                                >
                                  {isActionLoading === customer.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  ) : (
                                    <Pause className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              {customer.status === 'SUSPENDED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCustomerAction(customer.id, 'activate')}
                                  disabled={isActionLoading === customer.id}
                                  title="Activate customer"
                                >
                                  {isActionLoading === customer.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/customers/${customer.id}`)}
                                title="Edit customer"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCustomer(customer.id)}
                                disabled={isActionLoading === customer.id}
                                title="Delete customer"
                              >
                                {isActionLoading === customer.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No customers found matching your search.' : 'No customers found. Add your first customer to get started.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}