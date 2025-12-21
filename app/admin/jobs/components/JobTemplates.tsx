'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  Clock,
  DollarSign,
  Users,
  Wrench,
  CheckCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import type { JobTemplate } from '@/lib/db/jobs';

interface JobTemplatesProps {
  onTemplateSelect?: (template: JobTemplate) => void;
}

export function JobTemplates({ onTemplateSelect }: JobTemplatesProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(
    null
  );
  const [clients, setClients] = useState<
    Array<{ id: string; first_name: string; last_name: string }>
  >([]);

  // Form state for creating job from template
  const [selectedClientId, setSelectedClientId] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Form state for creating template
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title_template: '',
    description: '',
    description_template: '',
    category: '',
    estimated_duration_hours: 0,
    estimated_cost: 0,
    default_line_items: [] as any[],
  });
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadClients();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/job-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job templates.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !selectedClientId) {
      toast({
        title: 'Error',
        description: 'Please select a client.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/jobs?action=create_from_template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          client_id: selectedClientId,
          service_date: serviceDate,
          scheduled_time: scheduledTime,
          notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Job Created',
          description: `Job ${data.job.job_number} created successfully from template.`,
        });

        // Reset form
        setSelectedTemplate(null);
        setSelectedClientId('');
        setServiceDate('');
        setScheduledTime('');
        setNotes('');

        // Navigate to the new job
        router.push(`/jobs/${data.job.id}`);
      } else {
        throw new Error('Failed to create job');
      }
    } catch (error) {
      console.error('Failed to create job:', error);
      toast({
        title: 'Error',
        description: 'Failed to create job from template.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim()) return;

    try {
      setCreatingTemplate(true);

      const response = await fetch('/api/job-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateForm.name.trim(),
          title_template: templateForm.title_template.trim(),
          description: templateForm.description?.trim(),
          description_template: templateForm.description_template?.trim(),
          category: templateForm.category,
          estimated_duration_hours: templateForm.estimated_duration_hours,
          estimated_cost: templateForm.estimated_cost,
          default_line_items: templateForm.default_line_items,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        toast({
          title: 'Template Created',
          description: `Template "${data.template.name}" created successfully.`,
        });

        // Reset form and close dialog
        setTemplateForm({
          name: '',
          title_template: '',
          description: '',
          description_template: '',
          category: '',
          estimated_duration_hours: 0,
          estimated_cost: 0,
          default_line_items: [],
        });
        setShowCreateDialog(false);

        // Reload templates
        loadTemplates();
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create job template.',
        variant: 'destructive',
      });
    } finally {
      setCreatingTemplate(false);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      case 'repair':
        return <CheckCircle className="h-5 w-5" />;
      case 'installation':
        return <Plus className="h-5 w-5" />;
      case 'inspection':
        return <Users className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'maintenance':
        return 'bg-blue-100 text-blue-800';
      case 'repair':
        return 'bg-red-100 text-red-800';
      case 'installation':
        return 'bg-green-100 text-green-800';
      case 'inspection':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Job Templates</h2>
            <p className="text-muted-foreground">
              Quick job creation from pre-defined templates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Templates</h2>
          <p className="text-muted-foreground">
            Quick job creation from pre-defined templates
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Job Template</DialogTitle>
              <DialogDescription>
                Create a new job template for quick job creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template_name">Template Name *</Label>
                <Input
                  id="template_name"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, name: e.target.value })
                  }
                  placeholder="e.g., Kitchen Remodel"
                  required
                />
              </div>

              <div>
                <Label htmlFor="title_template">Job Title Template *</Label>
                <Input
                  id="title_template"
                  value={templateForm.title_template}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      title_template: e.target.value,
                    })
                  }
                  placeholder="e.g., Kitchen Remodel - {client_name}"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={templateForm.category}
                  onValueChange={(value) =>
                    setTemplateForm({ ...templateForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="painting">Painting</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_duration">Duration (hours)</Label>
                  <Input
                    id="estimated_duration"
                    type="number"
                    value={templateForm.estimated_duration_hours || ''}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        estimated_duration_hours: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="8"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    value={templateForm.estimated_cost || ''}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        estimated_cost: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="1500.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description_template">
                  Description Template
                </Label>
                <Textarea
                  id="description_template"
                  value={templateForm.description_template}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      description_template: e.target.value,
                    })
                  }
                  placeholder="Template for job description with variables like {client_name}, {service_date}, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="template_description">Description</Label>
                <Textarea
                  id="template_description"
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this template is for..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={creatingTemplate}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={
                    !templateForm.name.trim() ||
                    !templateForm.title_template.trim() ||
                    creatingTemplate
                  }
                >
                  {creatingTemplate ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Job Templates</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create job templates to speed up job creation with pre-filled
              information and line items.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  {template.category && (
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  )}
                </div>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {template.estimated_duration_hours && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{template.estimated_duration_hours}h</span>
                    </div>
                  )}
                  {template.estimated_cost && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${template.estimated_cost}</span>
                    </div>
                  )}
                </div>

                {template.default_line_items &&
                  template.default_line_items.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Includes {template.default_line_items.length} default line
                      item{template.default_line_items.length !== 1 ? 's' : ''}
                    </div>
                  )}

                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedTemplate(template);
                    if (onTemplateSelect) {
                      onTemplateSelect(template);
                    }
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Job from Template Dialog */}
      <Dialog
        open={!!selectedTemplate}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Job from Template</DialogTitle>
            <DialogDescription>
              {selectedTemplate &&
                `Create a new job using the "${selectedTemplate.name}" template.`}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Template Details</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Title:</strong> {selectedTemplate.title_template}
                  </div>
                  {selectedTemplate.estimated_duration_hours && (
                    <div>
                      <strong>Duration:</strong>{' '}
                      {selectedTemplate.estimated_duration_hours} hours
                    </div>
                  )}
                  {selectedTemplate.estimated_cost && (
                    <div>
                      <strong>Estimated Cost:</strong> $
                      {selectedTemplate.estimated_cost}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="service-date">Service Date</Label>
                    <Input
                      id="service-date"
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduled-time">Scheduled Time</Label>
                    <Input
                      id="scheduled-time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes for this job..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFromTemplate}
                  disabled={creating || !selectedClientId}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : 'Create Job'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
