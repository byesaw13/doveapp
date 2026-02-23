'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  PageContainer,
  EmptyState,
  Spinner,
  StatusBadge,
  Button,
  ButtonLoader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { LineItemsTable, LineItemsTotals } from '@/components/commercial';
import { useToast } from '@/components/ui/toast';
import type { EstimateWithRelations, EstimateStatus } from '@/types/estimate';
import {
  ArrowLeft,
  Download,
  Send,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

const statusVariantMap: Record<
  EstimateStatus,
  'draft' | 'sent' | 'approved' | 'declined' | 'expired'
> = {
  draft: 'draft',
  pending: 'draft',
  sent: 'sent',
  approved: 'approved',
  declined: 'declined',
  expired: 'expired',
  revised: 'sent',
};

const statusTransitions: Record<
  EstimateStatus,
  Array<{ to: EstimateStatus; label: string }>
> = {
  draft: [{ to: 'sent', label: 'Send to Client' }],
  pending: [{ to: 'sent', label: 'Send to Client' }],
  sent: [
    { to: 'approved', label: 'Mark Approved' },
    { to: 'declined', label: 'Mark Declined' },
  ],
  approved: [],
  declined: [],
  expired: [],
  revised: [{ to: 'sent', label: 'Resend' }],
};

export default function EstimateSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [estimate, setEstimate] = React.useState<EstimateWithRelations | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [showSendDialog, setShowSendDialog] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [statusUpdating, setStatusUpdating] = React.useState(false);
  const [sendVia, setSendVia] = React.useState({ email: true, sms: false });
  const [customMessage, setCustomMessage] = React.useState('');

  const estimateId = params.id as string;

  React.useEffect(() => {
    if (estimateId) loadEstimate();
  }, [estimateId]);

  const loadEstimate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/estimates/${estimateId}`);

      if (!response.ok) {
        if (response.status === 404) throw new Error('Estimate not found');
        throw new Error('Failed to load estimate');
      }

      const data = await response.json();
      setEstimate(data);
    } catch (error) {
      console.error('Failed to load estimate:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to load estimate',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEstimate = async () => {
    if (!estimate) return;

    setSending(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          via:
            sendVia.email && sendVia.sms
              ? 'both'
              : sendVia.email
                ? 'email'
                : 'sms',
          message: customMessage.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to send estimate');

      toast({
        title: 'Estimate Sent',
        description: 'The estimate has been sent to the client',
      });

      setShowSendDialog(false);
      setCustomMessage('');
      loadEstimate();
    } catch (error) {
      console.error('Failed to send estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to send estimate',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: EstimateStatus) => {
    if (!estimate) return;

    setStatusUpdating(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Status Updated',
        description: `Estimate marked as ${newStatus}`,
      });

      loadEstimate();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleConvertToJob = async () => {
    if (!estimate) return;

    try {
      const response = await fetch(`/api/estimates/${estimateId}/convert`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to convert estimate');

      const result = await response.json();

      toast({
        title: 'Converted to Job',
        description: `Job #${result.job_number} created`,
      });

      router.push(`/admin/jobs/${result.id}`);
    } catch (error) {
      console.error('Failed to convert estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert estimate to job',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="lg">
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!estimate) {
    return (
      <PageContainer maxWidth="lg">
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Estimate not found"
          description="The requested estimate could not be found."
          action={{
            label: 'Back to Estimates',
            onClick: () => router.push('/admin/estimates'),
          }}
        />
      </PageContainer>
    );
  }

  const transitions = statusTransitions[estimate.status] || [];
  const clientName = estimate.client
    ? `${estimate.client.first_name} ${estimate.client.last_name}`
    : estimate.lead
      ? `${estimate.lead.first_name} ${estimate.lead.last_name}`
      : 'Unknown';

  return (
    <PageContainer maxWidth="xl" padding="none">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/estimates')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold truncate">
                    #{estimate.estimate_number}
                  </h1>
                  <StatusBadge
                    variant={statusVariantMap[estimate.status]}
                    size="sm"
                    dot
                  >
                    {estimate.status}
                  </StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {estimate.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/api/estimates/${estimateId}/pdf`, '_blank')
                }
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              {estimate.status === 'draft' && (
                <Button size="sm" onClick={() => setShowSendDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              )}
              {estimate.status === 'approved' && (
                <Button size="sm" onClick={handleConvertToJob}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Convert to Job
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:flex lg:gap-6 px-4 lg:px-6 py-6">
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Estimate Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Estimate #:</span>
                  <span className="font-medium">
                    {estimate.estimate_number}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>
                    {format(new Date(estimate.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                {estimate.valid_until && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Valid Until:</span>
                    <span>
                      {format(new Date(estimate.valid_until), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {estimate.sent_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sent:</span>
                    <span>
                      {format(new Date(estimate.sent_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{clientName}</span>
                </div>
                {estimate.client?.email && (
                  <a
                    href={`mailto:${estimate.client.email}`}
                    className="text-sm text-primary hover:underline block"
                  >
                    {estimate.client.email}
                  </a>
                )}
                {estimate.client?.phone && (
                  <a
                    href={`tel:${estimate.client.phone}`}
                    className="text-sm text-primary hover:underline block"
                  >
                    {estimate.client.phone}
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {estimate.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {estimate.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemsTable
                items={estimate.line_items.map((item: any) => ({
                  id: item.id,
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  total: item.total,
                  tier: item.tier,
                  code: item.code,
                }))}
              />
              <LineItemsTotals
                subtotal={estimate.subtotal}
                taxAmount={estimate.tax_amount}
                taxRate={estimate.tax_rate}
                discountAmount={estimate.discount_amount}
                total={estimate.total}
                className="mt-4"
              />
            </CardContent>
          </Card>

          {estimate.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge
                    variant={statusVariantMap[estimate.status]}
                    size="sm"
                  >
                    {estimate.status}
                  </StatusBadge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">
                    ${estimate.total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    window.open(`/api/estimates/${estimateId}/pdf`, '_blank')
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {estimate.status === 'draft' && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => setShowSendDialog(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to Client
                  </Button>
                )}
                {transitions.map((t) => (
                  <ButtonLoader
                    key={t.to}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange(t.to)}
                    loading={statusUpdating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t.label}
                  </ButtonLoader>
                ))}
                {estimate.status === 'approved' && (
                  <Button
                    className="w-full justify-start"
                    onClick={handleConvertToJob}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Convert to Job
                  </Button>
                )}
                {estimate.converted_to_job_id && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={`/admin/jobs/${estimate.converted_to_job_id}`}>
                      <Briefcase className="h-4 w-4 mr-2" />
                      View Job
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
        <div className="flex gap-2">
          {estimate.status === 'draft' && (
            <Button className="flex-1" onClick={() => setShowSendDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          )}
          {estimate.status === 'approved' && (
            <Button className="flex-1" onClick={handleConvertToJob}>
              <Briefcase className="h-4 w-4 mr-2" />
              Convert to Job
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() =>
              window.open(`/api/estimates/${estimateId}/pdf`, '_blank')
            }
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Estimate</DialogTitle>
            <DialogDescription>
              Choose how to send this estimate to {clientName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={sendVia.email}
                  onCheckedChange={(checked) =>
                    setSendVia((prev) => ({ ...prev, email: !!checked }))
                  }
                />
                <label htmlFor="email" className="text-sm font-medium">
                  Send via Email
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={sendVia.sms}
                  onCheckedChange={(checked) =>
                    setSendVia((prev) => ({ ...prev, sms: !!checked }))
                  }
                />
                <label htmlFor="sms" className="text-sm font-medium">
                  Send via SMS
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Custom Message (Optional)
              </label>
              <Textarea
                placeholder="Add a personal message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendEstimate}
              disabled={sending || (!sendVia.email && !sendVia.sms)}
            >
              {sending ? 'Sending...' : 'Send Estimate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
