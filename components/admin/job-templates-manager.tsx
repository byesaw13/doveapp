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
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  Wrench,
  Zap,
  Paintbrush,
  Home,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface JobTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  estimated_duration_hours?: number;
  estimated_cost?: number;
  default_priority: string;
  template_data: {
    title?: string;
    description?: string;
    status?: string;
    line_items?: Array<{
      item_type: 'labor' | 'material';
      description: string;
      quantity: number;
      unit_price: number;
    }>;
  };
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

type JobTemplateFormData = {
  name: string;
  description: string;
  category: string;
  estimated_duration_hours: string;
  estimated_cost: string;
  default_priority: string;
  is_public: boolean;
  template_data: {
    title: string;
    description: string;
    status: string;
    line_items: Array<{
      item_type: 'labor' | 'material';
      description: string;
      quantity: number;
      unit_price: number;
    }>;
  };
};

export function JobTemplatesManager() {
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<JobTemplateFormData>({
    name: '',
    description: '',
    category: 'plumbing',
    estimated_duration_hours: '',
    estimated_cost: '',
    default_priority: 'medium',
    is_public: false,
    template_data: {
      title: '',
      description: '',
      status: 'scheduled',
      line_items: [] as Array<{
        item_type: 'labor' | 'material';
        description: string;
        quantity: number;
        unit_price: number;
      }>,
    },
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch(
        '/api/admin/job-templates?include_public=true'
      );
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load job templates.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job templates.',
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
      category: 'plumbing',
      estimated_duration_hours: '',
      estimated_cost: '',
      default_priority: 'medium',
      is_public: false,
      template_data: {
        title: '',
        description: '',
        status: 'scheduled',
        line_items: [],
      },
    });
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const templateData = {
        ...formData,
        estimated_duration_hours: formData.estimated_duration_hours
          ? parseFloat(formData.estimated_duration_hours)
          : undefined,
        estimated_cost: formData.estimated_cost
          ? parseFloat(formData.estimated_cost)
          : undefined,
      };

      const response = await fetch('/api/admin/job-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job template created successfully.',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        loadTemplates();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create template.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create template.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTemplate) return;

    setIsSaving(true);
    try {
      const templateData = {
        ...formData,
        estimated_duration_hours: formData.estimated_duration_hours
          ? parseFloat(formData.estimated_duration_hours)
          : undefined,
        estimated_cost: formData.estimated_cost
          ? parseFloat(formData.estimated_cost)
          : undefined,
      };

      const response = await fetch(
        `/api/admin/job-templates/${selectedTemplate.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job template updated successfully.',
        });
        setIsEditDialogOpen(false);
        loadTemplates();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update template.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: JobTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/job-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job template deleted successfully.',
        });
        loadTemplates();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete template.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template.',
        variant: 'destructive',
      });
    }
  };

  const handleUseTemplate = async (template: JobTemplate) => {
    // Track usage
    try {
      await fetch(`/api/admin/job-templates/${template.id}/use`, {
        method: 'POST',
      });
    } catch (error) {
      // Silently fail - usage tracking is not critical
    }

    // Navigate to job creation with template data
    const params = new URLSearchParams({
      template: template.id,
      title: template.template_data.title || '',
      description: template.template_data.description || '',
    });

    window.location.href = `/admin/jobs/new?${params.toString()}`;
  };

  const openEditDialog = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      estimated_duration_hours:
        template.estimated_duration_hours?.toString() || '',
      estimated_cost: template.estimated_cost?.toString() || '',
      default_priority: template.default_priority,
      is_public: template.is_public,
      template_data: {
        title: template.template_data.title || '',
        description: template.template_data.description || '',
        status: template.template_data.status || 'scheduled',
        line_items: template.template_data.line_items || [],
      },
    });
    setIsEditDialogOpen(true);
  };

  const addLineItem = () => {
    setFormData((prev: JobTemplateFormData) => ({
      ...prev,
      template_data: {
        ...prev.template_data,
        line_items: [
          ...prev.template_data.line_items,
          {
            item_type: 'labor',
            description: '',
            quantity: 1,
            unit_price: 0,
          },
        ],
      },
    }));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    setFormData((prev: JobTemplateFormData) => ({
      ...prev,
      template_data: {
        ...prev.template_data,
        line_items: prev.template_data.line_items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const removeLineItem = (index: number) => {
    setFormData((prev: JobTemplateFormData) => ({
      ...prev,
      template_data: {
        ...prev.template_data,
        line_items: prev.template_data.line_items.filter((_, i) => i !== index),
      },
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'plumbing':
        return <Wrench className="h-4 w-4" />;
      case 'electrical':
        return <Zap className="h-4 w-4" />;
      case 'hvac':
        return <Home className="h-4 w-4" />;
      case 'painting':
        return <Paintbrush className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-blue-100 text-blue-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const groupedTemplates = templates.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    },
    {} as Record<string, JobTemplate[]>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Templates</h2>
          <p className="text-muted-foreground">
            Create and manage reusable job configurations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <Button onClick={resetForm}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Job Template</DialogTitle>
              <DialogDescription>
                Create a reusable job template with predefined line items and
                settings.
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreate}
              isSaving={isSaving}
              submitLabel="Create Template"
              onAddLineItem={addLineItem}
              onUpdateLineItem={updateLineItem}
              onRemoveLineItem={removeLineItem}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="plumbing">Plumbing</TabsTrigger>
          <TabsTrigger value="electrical">Electrical</TabsTrigger>
          <TabsTrigger value="hvac">HVAC</TabsTrigger>
          <TabsTrigger value="painting">Painting</TabsTrigger>
        </TabsList>

        {(['all', 'plumbing', 'electrical', 'hvac', 'painting'] as const).map(
          (category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(category === 'all'
                  ? templates
                  : groupedTemplates[category] || []
                ).map((template) => (
                  <Card key={template.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          <CardTitle className="text-lg">
                            {template.name}
                          </CardTitle>
                        </div>
                        {template.is_public && (
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <CardDescription>
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getPriorityColor(
                              template.default_priority
                            )}
                          >
                            {template.default_priority}
                          </Badge>
                          <span className="capitalize">
                            {template.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {template.usage_count}
                        </div>
                      </div>

                      {(template.estimated_duration_hours ||
                        template.estimated_cost) && (
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {template.estimated_duration_hours && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {template.estimated_duration_hours}h
                            </div>
                          )}
                          {template.estimated_cost && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />$
                              {template.estimated_cost}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        {template.template_data.line_items?.length || 0} line
                        items
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <Briefcase className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(category === 'all'
                  ? templates
                  : groupedTemplates[category] || []
                ).length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p>
                      No {category === 'all' ? '' : category} templates found.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        resetForm();
                        if (category !== 'all') {
                          setFormData((prev: JobTemplateFormData) => ({
                            ...prev,
                            category,
                          }));
                        }
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Template
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )
        )}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Template</DialogTitle>
            <DialogDescription>
              Update the job template configuration and line items.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            isSaving={isSaving}
            submitLabel="Update Template"
            onAddLineItem={addLineItem}
            onUpdateLineItem={updateLineItem}
            onRemoveLineItem={removeLineItem}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Shared form component
interface TemplateFormProps {
  formData: {
    name: string;
    description: string;
    category: string;
    estimated_duration_hours: string;
    estimated_cost: string;
    default_priority: string;
    is_public: boolean;
    template_data: {
      title: string;
      description: string;
      status: string;
      line_items: Array<{
        item_type: 'labor' | 'material';
        description: string;
        quantity: number;
        unit_price: number;
      }>;
    };
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
  onAddLineItem: () => void;
  onUpdateLineItem: (index: number, field: string, value: any) => void;
  onRemoveLineItem: (index: number) => void;
}

function TemplateForm({
  formData,
  setFormData,
  onSubmit,
  isSaving,
  submitLabel,
  onAddLineItem,
  onUpdateLineItem,
  onRemoveLineItem,
}: TemplateFormProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev: JobTemplateFormData) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="e.g., Kitchen Faucet Installation"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData((prev: JobTemplateFormData) => ({
                ...prev,
                category: value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="painting">Painting</SelectItem>
              <SelectItem value="general">General</SelectItem>
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
            setFormData((prev: JobTemplateFormData) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="Brief description of this job template..."
          rows={2}
        />
      </div>

      {/* Estimates */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="duration">Est. Duration (hours)</Label>
          <Input
            id="duration"
            type="number"
            step="0.5"
            value={formData.estimated_duration_hours}
            onChange={(e) =>
              setFormData((prev: JobTemplateFormData) => ({
                ...prev,
                estimated_duration_hours: e.target.value,
              }))
            }
            placeholder="2.5"
          />
        </div>
        <div>
          <Label htmlFor="cost">Est. Cost ($)</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            value={formData.estimated_cost}
            onChange={(e) =>
              setFormData((prev: JobTemplateFormData) => ({
                ...prev,
                estimated_cost: e.target.value,
              }))
            }
            placeholder="150.00"
          />
        </div>
        <div>
          <Label htmlFor="priority">Default Priority</Label>
          <Select
            value={formData.default_priority}
            onValueChange={(value) =>
              setFormData((prev: JobTemplateFormData) => ({
                ...prev,
                default_priority: value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Details */}
      <div className="space-y-4">
        <h4 className="font-medium">Job Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="job-title">Default Job Title</Label>
            <Input
              id="job-title"
              value={formData.template_data.title}
              onChange={(e) =>
                setFormData((prev: JobTemplateFormData) => ({
                  ...prev,
                  template_data: {
                    ...prev.template_data,
                    title: e.target.value,
                  },
                }))
              }
              placeholder="e.g., Kitchen Faucet Installation"
            />
          </div>
          <div>
            <Label htmlFor="job-status">Default Status</Label>
            <Select
              value={formData.template_data.status}
              onValueChange={(value) =>
                setFormData((prev: JobTemplateFormData) => ({
                  ...prev,
                  template_data: { ...prev.template_data, status: value },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="job-description">Default Job Description</Label>
          <Textarea
            id="job-description"
            value={formData.template_data.description}
            onChange={(e) =>
              setFormData((prev: JobTemplateFormData) => ({
                ...prev,
                template_data: {
                  ...prev.template_data,
                  description: e.target.value,
                },
              }))
            }
            placeholder="Detailed description of the job..."
            rows={3}
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Line Items</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddLineItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {formData.template_data.line_items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No line items added yet. Click "Add Item" to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {formData.template_data.line_items.map((item, index) => (
              <div
                key={index}
                className="flex gap-3 items-end p-3 border rounded-lg"
              >
                <div className="w-24">
                  <Label>Type</Label>
                  <Select
                    value={item.item_type}
                    onValueChange={(value) =>
                      onUpdateLineItem(index, 'item_type', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      onUpdateLineItem(index, 'description', e.target.value)
                    }
                    placeholder="Item description"
                  />
                </div>
                <div className="w-20">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateLineItem(
                        index,
                        'quantity',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="w-24">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      onUpdateLineItem(
                        index,
                        'unit_price',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="w-20">
                  <Label>Total</Label>
                  <div className="p-2 bg-muted rounded text-sm font-medium">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveLineItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-public"
          checked={formData.is_public}
          onCheckedChange={(checked) =>
            setFormData((prev: JobTemplateFormData) => ({
              ...prev,
              is_public: !!checked,
            }))
          }
        />
        <Label htmlFor="is-public">
          Make this template public (available to all users)
        </Label>
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
