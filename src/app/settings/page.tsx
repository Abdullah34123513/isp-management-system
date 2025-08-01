'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Save, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Update session
      await update();
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  if (!session) {
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
              Settings
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {session.user?.username}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-2xl mx-auto">
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

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Current system status and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="text-muted-foreground">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Database</span>
                  <span className="text-green-600">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>Authentication</span>
                  <span className="text-green-600">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span>Real-time Updates</span>
                  <span className="text-green-600">Ready</span>
                </div>
                <div className="flex justify-between">
                  <span>Session</span>
                  <span className="text-muted-foreground">
                    {session.user?.username} ({session.user?.email})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>
                  Quick access to common management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/'}>
                  Dashboard
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/routers'}>
                  Manage Routers
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/customers'}>
                  Manage Customers
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/plans'}>
                  Manage Plans
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/invoices'}>
                  Manage Invoices
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}