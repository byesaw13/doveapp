'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import type { EstimateWithRelations } from '@/types/estimate';
import estimateDisclaimers from '@/data/pricebook/estimate_disclaimers.json';
import {
  ArrowLeft,
  Download,
  Send,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

export default function EstimateSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [estimate, setEstimate] = useState<EstimateWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendVia, setSendVia] = useState({ email: true, sms: false });
  const [customMessage, setCustomMessage] = useState('');

  const estimateId = params.id as string;

  useEffect(() => {
    loadEstimate();
  }, [estimateId]);

  const loadEstimate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/estimates/${estimateId}`);
      if (!response.ok) throw new Error('Failed to load estimate');
      const data = await response.json();
      setEstimate(data);
    } catch (error) {
      console.error('Failed to load estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to load estimate',
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
        description: 'Estimate has been sent to the client',
      });

      setShowSendDialog(false);
      setCustomMessage('');
      // Reload estimate to get updated status
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-blue-100 text-blue-700',
      sent: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      declined: 'bg-red-100 text-red-700',
      expired: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'declined':
        return <XCircle className="w-4 h-4" />;
      case 'sent':
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading estimate...</p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Estimate Not Found
          </h1>
          <Button onClick={() => router.push('/estimates')}>
            Back to Estimates
          </Button>
        </div>
      </div>
    );
  }

  const validUntil = new Date(estimate.created_at);
  validUntil.setDate(validUntil.getDate() + estimateDisclaimers.validity_days);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/estimates')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Estimates
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Estimate #{estimate.estimate_number}
              </h1>
              <p className="text-gray-600 mt-1">{estimate.title}</p>
            </div>
          </div>
          <Badge
            className={`inline-flex items-center gap-1.5 px-3 py-1 ${getStatusColor(estimate.status)}`}
          >
            {getStatusIcon(estimate.status)}
            {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
          </Badge>
        </div>

        {/* Estimate Details */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estimate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Estimate Number
                </label>
                <p className="font-semibold">{estimate.estimate_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created
                </label>
                <p>{new Date(estimate.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Valid Until
                </label>
                <p>{validUntil.toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {estimate.client && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Client
                    </label>
                    <p className="font-semibold">
                      {estimate.client.first_name} {estimate.client.last_name}
                    </p>
                  </div>
                  {estimate.client.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p>{estimate.client.email}</p>
                    </div>
                  )}
                  {estimate.client.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Phone
                      </label>
                      <p>{estimate.client.phone}</p>
                    </div>
                  )}
                </>
              )}
              {estimate.lead && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Lead
                  </label>
                  <p className="font-semibold">
                    {estimate.lead.first_name} {estimate.lead.last_name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estimate.line_items && estimate.line_items.length > 0 ? (
                estimate.line_items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {item.code && (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {item.code}
                          </Badge>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span>Qty: {item.quantity}</span>
                            {item.tier && <span>Tier: {item.tier}</span>}
                            <span>Rate: ${item.unit_price}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${item.total?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No line items found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>${estimate.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              {estimate.tax_amount && estimate.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium">Tax:</span>
                  <span>${estimate.tax_amount.toFixed(2)}</span>
                </div>
              )}
              {estimate.discount_amount && estimate.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium">Discount:</span>
                  <span>-${estimate.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${estimate.total.toFixed(2)}</span>
                </div>
                {estimate.total !== estimate.subtotal && (
                  <p className="text-sm text-orange-600 mt-1">
                    Minimum job total applied
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estimateDisclaimers.lines.map((line, index) => (
                <p key={index} className="text-sm text-gray-700">
                  • {line}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() =>
              window.open(`/api/estimates/${estimateId}/pdf`, '_blank')
            }
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>

          {estimate.status === 'draft' && (
            <Button
              onClick={() => setShowSendDialog(true)}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send to Client
            </Button>
          )}

          <Button
            onClick={() => router.push(`/estimates/${estimateId}`)}
            variant="outline"
          >
            Back to Edit
          </Button>
        </div>
      </div>

      {/* Send Estimate Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Estimate to Client</DialogTitle>
            <DialogDescription>
              Choose how to send this estimate to the client.
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
    </div>
  );
}
