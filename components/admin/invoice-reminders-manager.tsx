'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  Send,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';

interface InvoiceReminder {
  id: string;
  invoice_id: string;
  reminder_type: 'due_date_approaching' | 'overdue' | 'final_notice' | 'custom';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduled_for: string;
  sent_at?: string;
  subject?: string;
  message?: string;
  sent_via?: string;
  recipient_email?: string;
  error_message?: string;
  invoices?: {
    invoice_number: string;
    total: number;
    due_date: string;
    status: string;
    clients?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export function InvoiceRemindersManager() {
  const [reminders, setReminders] = useState<InvoiceReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  // Form state for creating new reminders
  const [newReminder, setNewReminder] = useState({
    invoice_id: '',
    reminder_type: 'custom' as const,
    scheduled_for: '',
    subject: '',
    message: '',
    recipient_email: '',
  });

  useEffect(() => {
    loadReminders();
  }, [filterStatus]);

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      console.log('Loading invoice reminders with params:', params.toString());

      const response = await fetch(`/api/admin/invoice-reminders?${params}`);
      console.log('API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        setReminders(data.reminders || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);

        let errorMessage = 'Failed to load invoice reminders.';
        if (response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Insufficient permissions.';
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      let errorMessage = 'Failed to load invoice reminders.';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'Invalid response from server.';
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    try {
      setIsCreating(true);

      const response = await fetch('/api/admin/invoice-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReminder),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Invoice reminder created successfully.',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        loadReminders();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create reminder.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create reminder.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewReminder({
      invoice_id: '',
      reminder_type: 'custom',
      scheduled_for: '',
      subject: '',
      message: '',
      recipient_email: '',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'due_date_approaching':
        return 'bg-blue-100 text-blue-700';
      case 'overdue':
        return 'bg-orange-100 text-orange-700';
      case 'final_notice':
        return 'bg-red-100 text-red-700';
      case 'custom':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const pendingReminders = reminders.filter((r) => r.status === 'pending');
  const sentReminders = reminders.filter((r) => r.status === 'sent');
  const failedReminders = reminders.filter((r) => r.status === 'failed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Reminders</h2>
          <p className="text-muted-foreground">
            Automated follow-ups to ensure timely payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadReminders} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Invoice Reminder</DialogTitle>
                <DialogDescription>
                  Send a custom reminder for an outstanding invoice.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice_id">Invoice ID</Label>
                    <Input
                      id="invoice_id"
                      value={newReminder.invoice_id}
                      onChange={(e) =>
                        setNewReminder((prev) => ({
                          ...prev,
                          invoice_id: e.target.value,
                        }))
                      }
                      placeholder="Enter invoice UUID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reminder_type">Type</Label>
                    <Select
                      value={newReminder.reminder_type}
                      onValueChange={(value: any) =>
                        setNewReminder((prev) => ({
                          ...prev,
                          reminder_type: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="due_date_approaching">
                          Due Date Approaching
                        </SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="final_notice">
                          Final Notice
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduled_for">Schedule For</Label>
                    <Input
                      id="scheduled_for"
                      type="datetime-local"
                      value={newReminder.scheduled_for}
                      onChange={(e) =>
                        setNewReminder((prev) => ({
                          ...prev,
                          scheduled_for: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient_email">Recipient Email</Label>
                    <Input
                      id="recipient_email"
                      type="email"
                      value={newReminder.recipient_email}
                      onChange={(e) =>
                        setNewReminder((prev) => ({
                          ...prev,
                          recipient_email: e.target.value,
                        }))
                      }
                      placeholder="client@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newReminder.subject}
                    onChange={(e) =>
                      setNewReminder((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    placeholder="Invoice reminder subject"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newReminder.message}
                    onChange={(e) =>
                      setNewReminder((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Reminder message..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReminder} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Reminder'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{pendingReminders.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{sentReminders.length}</p>
                <p className="text-sm text-muted-foreground">Sent</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{failedReminders.length}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{reminders.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reminder History</CardTitle>
              <CardDescription>
                Track all invoice reminders and their status
              </CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reminders found.</p>
              <p className="text-sm">
                Reminders are automatically created when invoices are sent.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {reminder.invoices?.invoice_number || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reminder.invoices?.clients
                            ? `${reminder.invoices.clients.first_name} ${reminder.invoices.clients.last_name}`
                            : 'Unknown Client'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(reminder.reminder_type)}>
                        {reminder.reminder_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(reminder.status)}
                        <Badge className={getStatusColor(reminder.status)}>
                          {reminder.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(reminder.scheduled_for),
                        'MMM d, yyyy HH:mm'
                      )}
                    </TableCell>
                    <TableCell>
                      {reminder.sent_at
                        ? format(
                            new Date(reminder.sent_at),
                            'MMM d, yyyy HH:mm'
                          )
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {reminder.recipient_email || 'No email'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
