'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import type { EstimateWithRelations } from '@/types/estimate';
import estimateDisclaimers from '@/scripts/data/pricebook/estimate_disclaimers.json';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Download,
} from 'lucide-react';

export default function ClientEstimateViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [estimate, setEstimate] = useState<EstimateWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientSignature, setClientSignature] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [changesDescription, setChangesDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleApprove = async () => {
    if (!clientName.trim() || !clientSignature.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide your name and signature',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientSignature: clientSignature.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to approve estimate');

      toast({
        title: 'Estimate Approved!',
        description: 'Thank you for your business. We will be in touch soon.',
      });

      setShowApprovalDialog(false);
      // Redirect to a thank you page or refresh
      setTimeout(() => {
        router.push('/estimates/approved');
      }, 2000);
    } catch (error) {
      console.error('Failed to approve estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve estimate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: declineReason.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to decline estimate');

      toast({
        title: 'Estimate Declined',
        description:
          'Thank you for your feedback. We appreciate your business.',
      });

      setShowDeclineDialog(false);
      setTimeout(() => {
        router.push('/estimates/declined');
      }, 2000);
    } catch (error) {
      console.error('Failed to decline estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline estimate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changesDescription.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please describe the changes you would like',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/estimates/${estimateId}/request-changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: changesDescription.trim(),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to request changes');

      toast({
        title: 'Changes Requested',
        description:
          'Thank you for your feedback. We will review and get back to you.',
      });

      setShowChangesDialog(false);
      setTimeout(() => {
        router.push('/estimates/changes-requested');
      }, 2000);
    } catch (error) {
      console.error('Failed to request changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to request changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading estimate...</p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Estimate Not Found
          </h1>
          <p className="text-gray-600">
            The estimate you're looking for doesn't exist or has expired.
          </p>
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">
              Dovetails Services
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Estimate #{estimate.estimate_number}
          </h1>
          <p className="text-xl text-gray-600">{estimate.title}</p>
          <p className="text-sm text-gray-500 mt-2">
            Valid until {validUntil.toLocaleDateString()}
          </p>
        </div>

        {/* Client Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            {estimate.client && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Estimate Details</CardTitle>
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
        <Card className="mb-6">
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
              <div className="border-t pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>${estimate.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => setShowApprovalDialog(true)}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            size="lg"
          >
            <CheckCircle className="w-5 h-5" />
            Approve Estimate
          </Button>

          <Button
            onClick={() => setShowDeclineDialog(true)}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2"
            size="lg"
          >
            <XCircle className="w-5 h-5" />
            Decline Estimate
          </Button>

          <Button
            onClick={() => setShowChangesDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
            size="lg"
          >
            <MessageSquare className="w-5 h-5" />
            Request Changes
          </Button>

          <Button
            onClick={() =>
              window.open(`/api/estimates/${estimateId}/pdf`, '_blank')
            }
            variant="outline"
            className="flex items-center gap-2"
            size="lg"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Estimate</DialogTitle>
            <DialogDescription>
              By approving this estimate, you agree to the terms and conditions
              and authorize work to begin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Full Name *
              </label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Signature *
              </label>
              <Input
                value={clientSignature}
                onChange={(e) => setClientSignature(e.target.value)}
                placeholder="Type your signature"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Approving...' : 'Approve Estimate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Estimate</DialogTitle>
            <DialogDescription>
              We're sorry this estimate doesn't meet your needs. Please let us
              know why.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Reason (Optional)
            </label>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Please tell us why you're declining..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeclineDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDecline}
              disabled={submitting}
              variant="destructive"
            >
              {submitting ? 'Declining...' : 'Decline Estimate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Let us know what changes you'd like to see in this estimate.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Description of Changes *
            </label>
            <Textarea
              value={changesDescription}
              onChange={(e) => setChangesDescription(e.target.value)}
              placeholder="Please describe the changes you would like..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowChangesDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestChanges} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Request Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
