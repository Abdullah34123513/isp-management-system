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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Users, DollarSign } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  rateLimit?: string;
  profileName?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    customers: number;
  };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    billingCycle: 'MONTHLY',
    rateLimit: '',
    profileName: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add plan');
      }

      setSuccess('Plan added successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Error adding plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to add plan');
    } finally {
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const response = await fetch(`/api/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update plan');
      }

      setSuccess('Plan updated successfully!');
      setIsEditDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to update plan');
    } finally {
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      setIsActionLoading(planId);
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete plan');
      }

      setSuccess('Plan deleted successfully!');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete plan');
    } finally {
      setIsActionLoading(null);
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
    }
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      billingCycle: plan.billingCycle,
      rateLimit: plan.rateLimit || '',
      profileName: plan.profileName || '',
      description: plan.description || '',
      isActive: plan.isActive
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      billingCycle: 'MONTHLY',
      rateLimit: '',
      profileName: '',
      description: '',
      isActive: true
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
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
              Plan Management
            </h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Plan</DialogTitle>
                  <DialogDescription>
                    Create a new service plan for customers
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPlan}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Plan Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Basic"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">
                        Price
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="29.99"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="billingCycle" className="text-right">
                        Billing Cycle
                      </Label>
                      <Select
                        value={formData.billingCycle}
                        onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rateLimit" className="text-right">
                        Rate Limit
                      </Label>
                      <Input
                        id="rateLimit"
                        type="text"
                        placeholder="10M/10M"
                        value={formData.rateLimit}
                        onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="profileName" className="text-right">
                        Profile Name
                      </Label>
                      <Input
                        id="profileName"
                        type="text"
                        placeholder="basic-profile"
                        value={formData.profileName}
                        onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="description" className="text-right pt-2">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Plan description..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="col-span-3"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="isActive" className="text-right">
                        Active
                      </Label>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add Plan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
              <CardTitle>Service Plans</CardTitle>
              <CardDescription>
                Manage service plans and pricing for your customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plans.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Billing Cycle</TableHead>
                        <TableHead>Rate Limit</TableHead>
                        <TableHead>Profile</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Customers</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {plan.price.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>{plan.billingCycle}</TableCell>
                          <TableCell>{plan.rateLimit || '-'}</TableCell>
                          <TableCell>{plan.profileName || '-'}</TableCell>
                          <TableCell>{getStatusBadge(plan.isActive)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {plan._count.customers}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(plan)}
                                title="Edit plan"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePlan(plan.id)}
                                disabled={isActionLoading === plan.id || plan._count.customers > 0}
                                title={plan._count.customers > 0 ? "Cannot delete plan with customers" : "Delete plan"}
                              >
                                {isActionLoading === plan.id ? (
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
                  No plans found. Add your first plan to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update plan details and settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPlan}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Plan Name
                </Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Price
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-billingCycle" className="text-right">
                  Billing Cycle
                </Label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-rateLimit" className="text-right">
                  Rate Limit
                </Label>
                <Input
                  id="edit-rateLimit"
                  type="text"
                  value={formData.rateLimit}
                  onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-profileName" className="text-right">
                  Profile Name
                </Label>
                <Input
                  id="edit-profileName"
                  type="text"
                  value={formData.profileName}
                  onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-isActive" className="text-right">
                  Active
                </Label>
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}