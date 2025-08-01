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
import { Plus, RefreshCw, Settings, Trash2, Wifi, WifiOff } from 'lucide-react';

interface Router {
  id: string;
  host: string;
  label: string;
  isActive: boolean;
  lastSync: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    customers: number;
    activeSessions: number;
  };
}

export default function RoutersPage() {
  const router = useRouter();
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    host: '',
    apiUser: '',
    apiPassword: '',
    label: ''
  });

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/routers');
      if (!response.ok) throw new Error('Failed to fetch routers');
      const data = await response.json();
      setRouters(data);
    } catch (error) {
      console.error('Error fetching routers:', error);
      setError('Failed to load routers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRouter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/routers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add router');
      }

      setSuccess('Router added successfully!');
      setIsAddDialogOpen(false);
      setFormData({ host: '', apiUser: '', apiPassword: '', label: '' });
      fetchRouters();
    } catch (error) {
      console.error('Error adding router:', error);
      setError(error instanceof Error ? error.message : 'Failed to add router');
    } finally {
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleSyncRouter = async (routerId: string) => {
    try {
      setIsSyncing(routerId);
      const response = await fetch(`/api/routers/${routerId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync router');
      }

      setSuccess('Router synced successfully!');
      fetchRouters();
    } catch (error) {
      console.error('Error syncing router:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync router');
    } finally {
      setIsSyncing(null);
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleDeleteRouter = async (routerId: string) => {
    if (!confirm('Are you sure you want to delete this router? This will also delete all associated customers.')) {
      return;
    }

    try {
      const response = await fetch(`/api/routers/${routerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete router');
      }

      setSuccess('Router deleted successfully!');
      fetchRouters();
    } catch (error) {
      console.error('Error deleting router:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete router');
    } finally {
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

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
              Router Management
            </h1>
            <div className="flex items-center space-x-4">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Router
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Router</DialogTitle>
                    <DialogDescription>
                      Connect a new MikroTik router to your ISP management system
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddRouter}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="host" className="text-right">
                          Host/IP
                        </Label>
                        <Input
                          id="host"
                          type="text"
                          placeholder="192.168.1.1"
                          value={formData.host}
                          onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="apiUser" className="text-right">
                          API User
                        </Label>
                        <Input
                          id="apiUser"
                          type="text"
                          placeholder="admin"
                          value={formData.apiUser}
                          onChange={(e) => setFormData({ ...formData, apiUser: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="apiPassword" className="text-right">
                          API Password
                        </Label>
                        <Input
                          id="apiPassword"
                          type="password"
                          placeholder="••••••••"
                          value={formData.apiPassword}
                          onChange={(e) => setFormData({ ...formData, apiPassword: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="label" className="text-right">
                          Label
                        </Label>
                        <Input
                          id="label"
                          type="text"
                          placeholder="Main Router"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Router</Button>
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
              <CardTitle>Connected Routers</CardTitle>
              <CardDescription>
                Manage your MikroTik routers and sync PPPoE customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {routers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Host/IP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customers</TableHead>
                      <TableHead>Active Sessions</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routers.map((router) => (
                      <TableRow key={router.id}>
                        <TableCell className="font-medium">{router.label || router.host}</TableCell>
                        <TableCell>{router.host}</TableCell>
                        <TableCell>
                          {router.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Wifi className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <WifiOff className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{router._count.customers}</TableCell>
                        <TableCell>{router._count.activeSessions}</TableCell>
                        <TableCell>{formatDate(router.lastSync)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSyncRouter(router.id)}
                              disabled={isSyncing === router.id}
                            >
                              {isSyncing === router.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/routers/${router.id}`)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRouter(router.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No routers configured. Add your first router to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}