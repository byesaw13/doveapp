'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Workflow,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Zap,
  Bell,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface JobWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  is_active: boolean;
  actions: Array<{
    type: string;
    title?: string;
    message?: string;
    recipients?: string[];
    auto_generate?: boolean;
    due_days?: number;
    hours_before?: number;
  }>;
  created_at: string;
  updated_at: string;
}

export function JobWorkflowsManager() {
  const [workflows, setWorkflows] = useState<JobWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<JobWorkflow | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_status: 'completed' as const,
    is_active: true,
    actions: [] as Array<{
      type: string;
      title?: string;
      message?: string;
      recipients?: string[];
      auto_generate?: boolean;
      due_days?: number;
      hours_before?: number;
    }>,
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/job-workflows');

      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load job workflows.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job workflows.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_status: 'completed',
      is_active: true,
      actions: [],
    });
  };

  const handleCreate = async () => {
    try {
      setIsCreating(true);

      const response = await fetch('/api/admin/job-workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job workflow created successfully.',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        loadWorkflows();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create workflow.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to create workflow.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedWorkflow) return;

    try {
      setIsCreating(true);

      const response = await fetch(
        `/api/admin/job-workflows/${selectedWorkflow.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job workflow updated successfully.',
        });
        setIsEditDialogOpen(false);
        loadWorkflows();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update workflow.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update workflow.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (workflow: JobWorkflow) => {
    if (!confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/job-workflows/${workflow.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job workflow deleted successfully.',
        });
        loadWorkflows();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete workflow.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (workflow: JobWorkflow) => {
    try {
      const response = await fetch(`/api/admin/job-workflows/${workflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !workflow.is_active }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Workflow ${!workflow.is_active ? 'activated' : 'deactivated'}.`,
        });
        loadWorkflows();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update workflow status.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update workflow status.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (workflow: JobWorkflow) => {
    setSelectedWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      trigger_status: workflow.trigger_status,
      is_active: workflow.is_active,
      actions: workflow.actions || [],
    });
    setIsEditDialogOpen(true);
  };

  const addAction = () => {
    setFormData((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          type: 'notification',
          title: '',
          message: '',
          recipients: ['admin'],
        },
      ],
    }));
  };

  const updateAction = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      ),
    }));
  };

  const removeAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Workflow className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'notification':
        return <Bell className="h-4 w-4" />;
      case 'invoice_generation':
        return <FileText className="h-4 w-4" />;
      case 'schedule_reminder':
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const groupedWorkflows = workflows.reduce(
    (acc, workflow) => {
      if (!acc[workflow.trigger_status]) {
        acc[workflow.trigger_status] = [];
      }
      acc[workflow.trigger_status].push(workflow);
      return acc;
    },
    {} as Record<string, JobWorkflow[]>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Workflows</h2>
          <p className="text-muted-foreground">
            Automate actions when job status changes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <Button onClick={resetForm}>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Job Workflow</DialogTitle>
              <DialogDescription>
                Create automated actions that trigger when job status changes.
              </DialogDescription>
            </DialogHeader>
            <WorkflowForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreate}
              isSaving={isCreating}
              submitLabel="Create Workflow"
              onAddAction={addAction}
              onUpdateAction={updateAction}
              onRemoveAction={removeAction}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{workflows.length}</p>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
              </div>
              <Workflow className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {workflows.filter((w) => w.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {workflows.filter((w) => !w.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
              <Pause className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.actions.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Actions</p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows by Trigger Status */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {(
          ['all', 'scheduled', 'in_progress', 'completed', 'cancelled'] as const
        ).map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(status === 'all'
                ? workflows
                : groupedWorkflows[status] || []
              ).map((workflow) => (
                <Card key={workflow.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(workflow.trigger_status)}
                        <CardTitle className="text-lg">
                          {workflow.name}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={workflow.is_active ? 'default' : 'secondary'}
                        >
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge
                          className={getStatusColor(workflow.trigger_status)}
                        >
                          {workflow.trigger_status}
                        </Badge>
                      </div>
                    </div>
                    {workflow.description && (
                      <CardDescription>{workflow.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {workflow.actions.length} action
                      {workflow.actions.length !== 1 ? 's' : ''}
                    </div>

                    <div className="space-y-2">
                      {workflow.actions.slice(0, 2).map((action, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          {getActionIcon(action.type)}
                          <span className="capitalize">
                            {action.type.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                      {workflow.actions.length > 2 && (
                        <div className="text-sm text-muted-foreground">
                          +{workflow.actions.length - 2} more actions
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(workflow)}
                      >
                        {workflow.is_active ? (
                          <Pause className="h-3 w-3 mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        {workflow.is_active ? 'Pause' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(workflow)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(workflow)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(status === 'all' ? workflows : groupedWorkflows[status] || [])
                .length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p>
                    No workflows for{' '}
                    {status === 'all' ? 'any status' : status.replace('_', ' ')}{' '}
                    trigger.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      resetForm();
                      if (status !== 'all') {
                        setFormData((prev) => ({
                          ...prev,
                          trigger_status: status as any,
                        }));
                      }
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Workflow
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Workflow</DialogTitle>
            <DialogDescription>
              Update the workflow configuration and actions.
            </DialogDescription>
          </DialogHeader>
          <WorkflowForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            isSaving={isCreating}
            submitLabel="Update Workflow"
            onAddAction={addAction}
            onUpdateAction={updateAction}
            onRemoveAction={removeAction}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Shared form component
interface WorkflowFormProps {
  formData: {
    name: string;
    description: string;
    trigger_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    is_active: boolean;
    actions: Array<{
      type: string;
      title?: string;
      message?: string;
      recipients?: string[];
      auto_generate?: boolean;
      due_days?: number;
      hours_before?: number;
    }>;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
  onAddAction: () => void;
  onUpdateAction: (index: number, field: string, value: any) => void;
  onRemoveAction: (index: number) => void;
}

function WorkflowForm({
  formData,
  setFormData,
  onSubmit,
  isSaving,
  submitLabel,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
}: WorkflowFormProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Workflow Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., Job Completed Notification"
          />
        </div>
        <div>
          <Label htmlFor="trigger_status">Trigger Status</Label>
          <Select
            value={formData.trigger_status}
            onValueChange={(value: any) =>
              setFormData((prev) => ({ ...prev, trigger_status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Job Scheduled</SelectItem>
              <SelectItem value="in_progress">Job Started</SelectItem>
              <SelectItem value="completed">Job Completed</SelectItem>
              <SelectItem value="cancelled">Job Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Brief description of what this workflow does..."
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
          }
          className="rounded"
        />
        <Label htmlFor="is_active">Workflow is active</Label>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Actions</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddAction}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Action
          </Button>
        </div>

        {formData.actions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No actions added yet. Click "Add Action" to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {formData.actions.map((action, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select
                      value={action.type}
                      onValueChange={(value) =>
                        onUpdateAction(index, 'type', value)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">
                          Notification
                        </SelectItem>
                        <SelectItem value="invoice_generation">
                          Generate Invoice
                        </SelectItem>
                        <SelectItem value="schedule_reminder">
                          Schedule Reminder
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveAction(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {action.type === 'notification' && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Notification title"
                      value={action.title || ''}
                      onChange={(e) =>
                        onUpdateAction(index, 'title', e.target.value)
                      }
                    />
                    <Textarea
                      placeholder="Notification message"
                      value={action.message || ''}
                      onChange={(e) =>
                        onUpdateAction(index, 'message', e.target.value)
                      }
                      rows={2}
                    />
                    <div className="flex gap-2">
                      {['admin', 'technician', 'client'].map((recipient) => (
                        <label
                          key={recipient}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={
                              action.recipients?.includes(recipient) || false
                            }
                            onChange={(e) => {
                              const current = action.recipients || [];
                              const updated = e.target.checked
                                ? [...current, recipient]
                                : current.filter((r) => r !== recipient);
                              onUpdateAction(index, 'recipients', updated);
                            }}
                          />
                          <span className="text-sm capitalize">
                            {recipient}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {action.type === 'invoice_generation' && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={action.auto_generate || false}
                        onChange={(e) =>
                          onUpdateAction(
                            index,
                            'auto_generate',
                            e.target.checked
                          )
                        }
                      />
                      <span className="text-sm">Auto-generate invoice</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Due days"
                      value={action.due_days || ''}
                      onChange={(e) =>
                        onUpdateAction(
                          index,
                          'due_days',
                          parseInt(e.target.value) || 30
                        )
                      }
                      className="w-24"
                    />
                  </div>
                )}

                {action.type === 'schedule_reminder' && (
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      placeholder="Hours before"
                      value={action.hours_before || ''}
                      onChange={(e) =>
                        onUpdateAction(
                          index,
                          'hours_before',
                          parseInt(e.target.value) || 24
                        )
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      hours before scheduled time
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
