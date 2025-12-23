'use client';

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Copy,
  FileText,
  Zap,
  Star,
  StarOff,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface EmailTemplate {
  id: string;
  name: string;
  type: 'invoice' | 'estimate' | 'general';
  subject_template: string;
  body_template: string;
  is_default: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

interface TemplateFormData {
  name: string;
  type: 'invoice' | 'estimate' | 'general';
  subject_template: string;
  body_template: string;
  variables: string[];
}

export function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    type: 'invoice' as 'invoice' | 'estimate' | 'general',
    subject_template: '',
    body_template: '',
    variables: [] as string[],
  });

  // Preview data
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load email templates.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email templates.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'invoice',
      subject_template: '',
      body_template: '',
      variables: [],
    });
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Email template created successfully.',
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
      const response = await fetch(
        `/api/admin/email-templates/${selectedTemplate.id}`,
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
          description: 'Email template updated successfully.',
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

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/email-templates/${template.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Email template deleted successfully.',
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

  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject_template: template.subject_template,
      body_template: template.body_template,
      variables: template.variables || [],
    });
    setIsEditDialogOpen(true);
  };

  const openPreviewDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);

    // Set up preview data based on template type
    if (template.type === 'invoice') {
      setPreviewData({
        invoice_number: 'INV-001',
        company_name: 'Your Company Name',
        client_name: 'John Smith',
        total_amount: '1250.00',
        issue_date: '2024-01-15',
        due_date: '2024-02-15',
        balance_due: '1250.00',
        company_email: 'billing@yourcompany.com',
        company_phone: '(555) 123-4567',
      });
    } else if (template.type === 'estimate') {
      setPreviewData({
        estimate_id: 'EST-001',
        company_name: 'Your Company Name',
        client_name: 'John Smith',
        title: 'Kitchen Renovation',
        total_amount: '8500.00',
        valid_until: '2024-02-15',
        company_email: 'estimates@yourcompany.com',
        company_phone: '(555) 123-4567',
      });
    }

    setIsPreviewDialogOpen(true);
  };

  const renderPreview = (template: string) => {
    if (!selectedTemplate) return template;

    let result = template;
    Object.entries(previewData).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      case 'estimate':
        return <Zap className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const groupedTemplates = templates.reduce(
    (acc, template) => {
      if (!acc[template.type]) {
        acc[template.type] = [];
      }
      acc[template.type].push(template);
      return acc;
    },
    {} as Record<string, EmailTemplate[]>
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
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">
            Customize email templates for invoices and estimates
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>
                Create a new email template for sending invoices or estimates.
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreate}
              isSaving={isSaving}
              submitLabel="Create Template"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates by Type */}
      <Tabs defaultValue="invoice" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoice">Invoice Templates</TabsTrigger>
          <TabsTrigger value="estimate">Estimate Templates</TabsTrigger>
          <TabsTrigger value="general">General Templates</TabsTrigger>
        </TabsList>

        {(['invoice', 'estimate', 'general'] as const).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(groupedTemplates[type] || []).map((template) => (
                <Card key={template.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTemplateIcon(template.type)}
                        <CardTitle className="text-lg">
                          {template.name}
                        </CardTitle>
                      </div>
                      {template.is_default && (
                        <Badge variant="secondary">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <p className="text-sm text-muted-foreground truncate">
                        {template.subject_template}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Body Preview
                      </Label>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {template.body_template.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreviewDialog(template)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(template)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {!template.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(groupedTemplates[type] || []).length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {type} templates found.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      resetForm();
                      setFormData((prev) => ({ ...prev, type }));
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
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update the email template content and settings.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            isSaving={isSaving}
            submitLabel="Update Template"
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how this email template will look with sample data.
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <div className="p-3 bg-muted rounded-md font-medium">
                  {renderPreview(selectedTemplate.subject_template)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Body</Label>
                <div className="h-96 overflow-y-auto p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                  {renderPreview(selectedTemplate.body_template)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Subject: ${renderPreview(selectedTemplate.subject_template)}\n\n${renderPreview(selectedTemplate.body_template)}`
                    );
                    toast({
                      title: 'Copied',
                      description: 'Preview copied to clipboard.',
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Shared form component
interface TemplateFormProps {
  formData: TemplateFormData;
  setFormData: Dispatch<SetStateAction<TemplateFormData>>;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
}

function TemplateForm({
  formData,
  setFormData,
  onSubmit,
  isSaving,
  submitLabel,
}: TemplateFormProps) {
  const availableVariables = {
    invoice: [
      'invoice_number',
      'company_name',
      'client_name',
      'total_amount',
      'issue_date',
      'due_date',
      'balance_due',
      'company_email',
      'company_phone',
    ],
    estimate: [
      'estimate_id',
      'company_name',
      'client_name',
      'title',
      'total_amount',
      'valid_until',
      'company_email',
      'company_phone',
    ],
    general: ['company_name', 'client_name', 'company_email', 'company_phone'],
  };

  const currentVariables = availableVariables[formData.type];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., Default Invoice"
          />
        </div>
        <div>
          <Label htmlFor="type">Template Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) =>
              setFormData((prev) => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="estimate">Estimate</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="subject">Subject Template</Label>
        <Input
          id="subject"
          value={formData.subject_template}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              subject_template: e.target.value,
            }))
          }
          placeholder="e.g., Invoice {{invoice_number}} from {{company_name}}"
        />
      </div>

      <div>
        <Label htmlFor="body">Body Template</Label>
        <Textarea
          id="body"
          value={formData.body_template}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, body_template: e.target.value }))
          }
          placeholder="Write your email template here..."
          rows={12}
        />
      </div>

      <div>
        <Label>Available Variables</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {currentVariables.map((variable) => (
            <Button
              key={variable}
              variant="outline"
              size="sm"
              onClick={() => {
                const textarea = document.getElementById(
                  'body'
                ) as HTMLTextAreaElement;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const text = textarea.value;
                  const before = text.substring(0, start);
                  const after = text.substring(end);
                  textarea.value = `${before}{{${variable}}}${after}`;
                  textarea.focus();
                  textarea.setSelectionRange(
                    start + variable.length + 4,
                    start + variable.length + 4
                  );
                  setFormData((prev) => ({
                    ...prev,
                    body_template: textarea.value,
                  }));
                }
              }}
            >
              {`{{${variable}}}`}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Click variables to insert them into your template.
        </p>
      </div>

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
