'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Users, Router, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardStats {
  totalCustomers: number;
  activeRouters: number;
  activeSessions: number;
  pendingInvoices: number;
}

interface Router {
  id: string;
  host: string;
  label: string;
  isActive: boolean;
  lastSync: string | null;
  _count: {
    customers: number;
    activeSessions: number;
  };
}

interface Customer {
  id: string;
  username: string;
  status: string;
  plan?: {
    name: string;
    price: number;
    billingCycle: string;
  };
  router: {
    label: string;
  };
  createdAt: string;
}

interface ActiveSession {
  id: string;
  username: string;
  ipAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  router: {
    label: string;
  };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeRouters: 0,
    activeSessions: 0,
    pendingInvoices: 0
  });
  const [routers, setRouters] = useState<Router[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const [customersRes, routersRes, sessionsRes, invoicesRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/routers'),
        fetch('/api/sessions'),
        fetch('/api/invoices?status=PENDING')
      ]);

      const customers = await customersRes.json();
      const routers = await routersRes.json();
      const sessions = await sessionsRes.json();
      const invoices = await invoicesRes.json();

      setStats({
        totalCustomers: customers.length || 0,
        activeRouters: routers.filter((r: Router) => r.isActive).length || 0,
        activeSessions: sessions.length || 0,
        pendingInvoices: invoices.length || 0
      });

      setRouters(routers.slice(0, 5)); // Show only 5 most recent routers
      setRecentCustomers(customers.slice(0, 10)); // Show only 10 most recent customers
      setActiveSessions(sessions.slice(0, 10)); // Show only 10 most recent sessions
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ISP Management Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {session.user?.username}
              </span>
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => router.push('/api/auth/signout')}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered customers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Routers</CardTitle>
                <Router className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeRouters}</div>
                <p className="text-xs text-muted-foreground">
                  Connected routers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Sessions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Currently connected PPPoE sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Uptime</TableHead>
                        <TableHead>Data Usage</TableHead>
                        <TableHead>Router</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSessions.length > 0 ? (
                        activeSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">{session.username}</TableCell>
                            <TableCell>{session.ipAddress}</TableCell>
                            <TableCell>{session.uptime}</TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div>↓ {formatBytes(session.bytesIn)}</div>
                                <div>↑ {formatBytes(session.bytesOut)}</div>
                              </div>
                            </TableCell>
                            <TableCell>{session.router.label}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No active sessions
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and navigation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => router.push('/routers')}>
                  Manage Routers
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/customers')}>
                  Manage Customers
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/plans')}>
                  Manage Plans
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/invoices')}>
                  View Invoices
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/settings')}>
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Customers */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>
                Latest customer registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Router</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCustomers.length > 0 ? (
                      recentCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.username}</TableCell>
                          <TableCell>{getStatusBadge(customer.status)}</TableCell>
                          <TableCell>{customer.plan?.name || 'No Plan'}</TableCell>
                          <TableCell>{customer.router.label}</TableCell>
                          <TableCell>
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No customers yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}