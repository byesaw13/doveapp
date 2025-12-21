'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  User,
  Building,
  FileText,
  Edit,
  Trash2,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface CustomerCommunication {
  id: string;
  customer_id: string;
  communication_type:
    | 'call'
    | 'email'
    | 'note'
    | 'meeting'
    | 'sms'
    | 'in_person'
    | 'other';
  direction: 'inbound' | 'outbound' | 'internal';
  subject?: string;
  content?: string;
  summary?: string;
  contact_person?: string;
  contact_method?: string;
  occurred_at: string;
  duration_minutes?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  requires_followup: boolean;
  followup_date?: string;
  followup_notes?: string;
  tags?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  created_by?: string;
  created_at: string;
  updated_at: string;
  job_id?: string;
  invoice_id?: string;
}

interface CustomerCommunicationsProps {
  customerId?: string;
  customerName?: string;
}

interface CommunicationFormData {
  communication_type: CustomerCommunication['communication_type'];
  direction: CustomerCommunication['direction'];
  subject: string;
  content: string;
  contact_person: string;
  contact_method: string;
  occurred_at: string;
  duration_minutes: string;
  priority: CustomerCommunication['priority'];
  requires_followup: boolean;
  followup_date: string;
  followup_notes: string;
  tags: string[];
  sentiment: CustomerCommunication['sentiment'];
  job_id: string;
  invoice_id: string;
}

export function CustomerCommunications({
  customerId,
  customerName,
}: CustomerCommunicationsProps) {
  const [communications, setCommunications] = useState<CustomerCommunication[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCommunication, setEditingCommunication] =
    useState<CustomerCommunication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState<CommunicationFormData>({
    communication_type: 'call',
    direction: 'outbound',
    subject: '',
    content: '',
    contact_person: '',
    contact_method: '',
    occurred_at: new Date().toISOString().slice(0, 16),
    duration_minutes: '',
    priority: 'normal',
    requires_followup: false,
    followup_date: '',
    followup_notes: '',
    tags: [],
    sentiment: 'neutral',
    job_id: '',
    invoice_id: '',
  });

  useEffect(() => {
    loadCommunications();
  }, [customerId]);

  const loadCommunications = async () => {
    try {
      setLoading(true);
      let url = '/api/admin/customer-communications';

      if (customerId) {
        url += `?customer_id=${customerId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load communications');
      }

      const data = await response.json();
      setCommunications(data);
    } catch (error) {
      console.error('Error loading communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunication = async () => {
    try {
      const payload = {
        ...formData,
        customer_id: customerId,
        occurred_at: new Date(formData.occurred_at).toISOString(),
        duration_minutes: formData.duration_minutes
          ? parseInt(formData.duration_minutes)
          : null,
        followup_date: formData.followup_date
          ? new Date(formData.followup_date).toISOString()
          : null,
        tags: formData.tags.filter((tag) => tag.trim()),
      };

      const response = await fetch('/api/admin/customer-communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create communication');
      }

      await loadCommunications();
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating communication:', error);
      alert('Failed to create communication');
    }
  };

  const handleUpdateCommunication = async () => {
    if (!editingCommunication) return;

    try {
      const payload = {
        ...formData,
        occurred_at: new Date(formData.occurred_at).toISOString(),
        duration_minutes: formData.duration_minutes
          ? parseInt(formData.duration_minutes)
          : null,
        followup_date: formData.followup_date
          ? new Date(formData.followup_date).toISOString()
          : null,
        tags: formData.tags.filter((tag) => tag.trim()),
      };

      const response = await fetch(
        `/api/admin/customer-communications/${editingCommunication.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update communication');
      }

      await loadCommunications();
      setShowEditDialog(false);
      setEditingCommunication(null);
      resetForm();
    } catch (error) {
      console.error('Error updating communication:', error);
      alert('Failed to update communication');
    }
  };

  const handleDeleteCommunication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this communication?')) return;

    try {
      const response = await fetch(`/api/admin/customer-communications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete communication');
      }

      await loadCommunications();
    } catch (error) {
      console.error('Error deleting communication:', error);
      alert('Failed to delete communication');
    }
  };

  const resetForm = () => {
    setFormData({
      communication_type: 'call',
      direction: 'outbound',
      subject: '',
      content: '',
      contact_person: '',
      contact_method: '',
      occurred_at: new Date().toISOString().slice(0, 16),
      duration_minutes: '',
      priority: 'normal',
      requires_followup: false,
      followup_date: '',
      followup_notes: '',
      tags: [],
      sentiment: 'neutral',
      job_id: '',
      invoice_id: '',
    });
  };

  const openEditDialog = (communication: CustomerCommunication) => {
    setEditingCommunication(communication);
    setFormData({
      communication_type: communication.communication_type,
      direction: communication.direction,
      subject: communication.subject || '',
      content: communication.content || '',
      contact_person: communication.contact_person || '',
      contact_method: communication.contact_method || '',
      occurred_at: new Date(communication.occurred_at)
        .toISOString()
        .slice(0, 16),
      duration_minutes: communication.duration_minutes?.toString() || '',
      priority: communication.priority,
      requires_followup: communication.requires_followup,
      followup_date: communication.followup_date
        ? new Date(communication.followup_date).toISOString().slice(0, 16)
        : '',
      followup_notes: communication.followup_notes || '',
      tags: communication.tags || [],
      sentiment: communication.sentiment,
      job_id: communication.job_id || '',
      invoice_id: communication.invoice_id || '',
    });
    setShowEditDialog(true);
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
        return <User className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'in_person':
        return <Building className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'secondary',
      normal: 'outline',
      high: 'default',
      urgent: 'destructive',
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      cancelled: 'outline',
      failed: 'destructive',
    } as const;

    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      completed: <CheckCircle className="w-3 h-3 mr-1" />,
      cancelled: <XCircle className="w-3 h-3 mr-1" />,
      failed: <AlertTriangle className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;

    const variants = {
      positive: 'default',
      neutral: 'outline',
      negative: 'destructive',
    } as const;

    return (
      <Badge
        variant={variants[sentiment as keyof typeof variants] || 'outline'}
      >
        {sentiment}
      </Badge>
    );
  };

  const filteredCommunications = communications.filter((comm) => {
    const matchesSearch =
      !searchQuery ||
      comm.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.contact_person?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === 'all' || comm.communication_type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' || comm.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const CommunicationDialog = ({
    open,
    onOpenChange,
    title,
    onSubmit,
    submitLabel,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    onSubmit: () => void;
    submitLabel: string;
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.communication_type}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({
                    ...prev,
                    communication_type: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="sms">SMS/Text</SelectItem>
                  <SelectItem value="note">Internal Note</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={formData.direction}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, direction: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Brief subject or title"
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Detailed communication content..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contact_person: e.target.value,
                  }))
                }
                placeholder="Who you spoke with"
              />
            </div>

            <div>
              <Label htmlFor="contact_method">Contact Method</Label>
              <Input
                id="contact_method"
                value={formData.contact_method}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contact_method: e.target.value,
                  }))
                }
                placeholder="Phone number, email, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="occurred_at">Date & Time</Label>
              <Input
                id="occurred_at"
                type="datetime-local"
                value={formData.occurred_at}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    occurred_at: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration_minutes: e.target.value,
                  }))
                }
                placeholder="For calls/meetings"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select
                value={formData.sentiment || 'neutral'}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, sentiment: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requires_followup"
                checked={formData.requires_followup}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requires_followup: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="requires_followup">Requires Follow-up</Label>
            </div>
          </div>

          {formData.requires_followup && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="followup_date">Follow-up Date</Label>
                <Input
                  id="followup_date"
                  type="datetime-local"
                  value={formData.followup_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      followup_date: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="followup_notes">Follow-up Notes</Label>
                <Input
                  id="followup_notes"
                  value={formData.followup_notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      followup_notes: e.target.value,
                    }))
                  }
                  placeholder="What needs to be followed up on?"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags.join(', ')}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tags: e.target.value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="urgent, complaint, billing, etc."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {customerName
              ? `Communications with ${customerName}`
              : 'All Communications'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Track all customer interactions and communications
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Communication
            </Button>
          </DialogTrigger>
          <CommunicationDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            title="Add New Communication"
            onSubmit={handleCreateCommunication}
            submitLabel="Add Communication"
          />
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search communications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="call">Phone Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="sms">SMS/Text</SelectItem>
                <SelectItem value="note">Internal Note</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Communications ({filteredCommunications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCommunications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">
                No communications found
              </p>
              <p className="mb-4">
                Start tracking customer interactions by adding your first
                communication.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Communication
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCommunications.map((comm) => (
                <div
                  key={comm.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                        {getCommunicationIcon(comm.communication_type)}
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {comm.subject ||
                            `${comm.communication_type} communication`}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(comm.occurred_at).toLocaleDateString()}
                          {comm.contact_person && (
                            <>
                              <span>•</span>
                              <span>{comm.contact_person}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(comm.priority)}
                      {getStatusBadge(comm.status)}
                      {getSentimentBadge(comm.sentiment)}
                    </div>
                  </div>

                  {comm.content && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {comm.content}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">
                        {comm.communication_type.replace('_', ' ')}
                      </span>
                      <span className="capitalize">{comm.direction}</span>
                      {comm.duration_minutes && (
                        <span>{comm.duration_minutes} min</span>
                      )}
                      {comm.tags && comm.tags.length > 0 && (
                        <div className="flex gap-1">
                          {comm.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {comm.tags.length > 3 && (
                            <span>+{comm.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(comm)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCommunication(comm.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {comm.requires_followup && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center gap-2 text-sm text-yellow-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Follow-up required</span>
                        {comm.followup_date && (
                          <span>
                            by{' '}
                            {new Date(comm.followup_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {comm.followup_notes && (
                        <p className="text-sm text-yellow-700 mt-1">
                          {comm.followup_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <CommunicationDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditingCommunication(null);
        }}
        title="Edit Communication"
        onSubmit={handleUpdateCommunication}
        submitLabel="Update Communication"
      />
    </div>
  );
}
