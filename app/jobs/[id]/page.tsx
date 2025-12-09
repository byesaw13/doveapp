'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getJob,
  updateJobStatusWithValidation,
  deleteLineItem,
  addLineItem,
} from '@/lib/db/jobs';
import {
  getPaymentsByJob,
  createPayment,
  deletePayment,
  getJobPaymentSummary,
} from '@/lib/db/payments';
import { getJobPhotos } from '@/lib/db/job-photos';
import { RecordPaymentDialog } from '@/app/jobs/components/RecordPaymentDialog';
import { PhotoUpload } from '@/app/jobs/components/PhotoUpload';
import { PhotoGallery } from '@/app/jobs/components/PhotoGallery';
import type { JobWithDetails, LineItemInsert } from '@/types/job';
import type { Payment } from '@/types/payment';
import type { PaymentFormData } from '@/lib/validations/payment';
import type { JobPhoto } from '@/types/job-photo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState({
    total: 0,
    paid: 0,
    remaining: 0,
    status: 'unpaid',
  });
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJob();
  }, [params.id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const [jobData, paymentsData, summaryData, photosData] =
        await Promise.all([
          getJob(params.id as string),
          getPaymentsByJob(params.id as string),
          getJobPaymentSummary(params.id as string),
          getJobPhotos(params.id as string),
        ]);
      setJob(jobData);
      setPayments(paymentsData);
      setPaymentSummary(summaryData);
      setPhotos(photosData);
    } catch (error) {
      console.error('Failed to load job:', error);
      alert('Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;

    try {
      await updateJobStatusWithValidation(job.id, newStatus);
      await loadJob();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const handleCreateInvoice = async () => {
    if (!job) return;

    try {
      const response = await fetch(`/api/jobs/${job.id}/invoice`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      const invoice = await response.json();
      alert(`Invoice ${invoice.invoice_number} created successfully!`);
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert(
        'Failed to create invoice: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const handleDeleteLineItem = async (itemId: string) => {
    if (!job || !confirm('Delete this line item?')) return;

    try {
      await deleteLineItem(itemId, job.id);
      await loadJob();
    } catch (error) {
      console.error('Failed to delete line item:', error);
      alert('Failed to delete line item');
    }
  };

  const handleRecordPayment = async (data: PaymentFormData) => {
    if (!job) return;

    try {
      await createPayment({
        job_id: job.id,
        amount: data.amount,
        payment_method: data.payment_method || null,
        payment_date: data.payment_date,
        notes: data.notes || null,
        square_payment_id: null,
      });
      setPaymentDialogOpen(false);
      await loadJob();
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      await deletePayment(paymentId);
      await loadJob();
    } catch (error) {
      console.error('Failed to delete payment:', error);
      alert('Failed to delete payment');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!job) return;

    try {
      // Open the invoice PDF in a new tab
      window.open(`/api/invoices/${job.id}`, '_blank');
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      alert('Failed to generate invoice');
    }
  };

  const handlePhotoUploaded = (photo: JobPhoto) => {
    setPhotos((prev) => [...prev, photo]);
  };

  const handlePhotoDeleted = (photoId: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading job...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-500">Job not found</p>
          <Link href="/jobs">
            <Button className="mt-4">Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    quote: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    invoiced: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{job.job_number}</h1>
          <p className="text-gray-500">{job.title}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs">
            <Button variant="outline">Back to Jobs</Button>
          </Link>
          <Link href={`/jobs/${job.id}/edit`}>
            <Button>Edit Job</Button>
          </Link>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[job.status]}`}
            >
              {job.status.charAt(0).toUpperCase() +
                job.status.slice(1).replace('_', ' ')}
            </span>
            <div className="flex gap-2">
              {job.status === 'quote' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('scheduled')}
                >
                  Mark as Scheduled
                </Button>
              )}
              {job.status === 'scheduled' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('in_progress')}
                >
                  Start Job
                </Button>
              )}
              {job.status === 'in_progress' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('completed')}
                >
                  Mark Completed
                </Button>
              )}
              {job.status === 'completed' && job.ready_for_invoice && (
                <Button
                  size="sm"
                  onClick={handleCreateInvoice}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Invoice
                </Button>
              )}
              {job.status === 'completed' && !job.ready_for_invoice && (
                <div className="text-sm text-green-600 font-medium">
                  ✓ Ready for Invoicing (Phase 4)
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-semibold">Name: </span>
            {job.client.first_name} {job.client.last_name}
          </div>
          {job.client.company_name && (
            <div>
              <span className="font-semibold">Company: </span>
              {job.client.company_name}
            </div>
          )}
          {job.client.email && (
            <div>
              <span className="font-semibold">Email: </span>
              <a href={`mailto:${job.client.email}`} className="text-blue-600">
                {job.client.email}
              </a>
            </div>
          )}
          {job.client.phone && (
            <div>
              <span className="font-semibold">Phone: </span>
              <a href={`tel:${job.client.phone}`} className="text-blue-600">
                {job.client.phone}
              </a>
            </div>
          )}
          {job.client.address_line1 && (
            <div>
              <span className="font-semibold">Address: </span>
              {job.client.address_line1}
              {job.client.city && `, ${job.client.city}`}
              {job.client.state && `, ${job.client.state}`}
              {job.client.zip_code && ` ${job.client.zip_code}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {job.description && (
            <div>
              <span className="font-semibold">Description: </span>
              {job.description}
            </div>
          )}
          {job.service_date && (
            <div>
              <span className="font-semibold">Service Date: </span>
              {new Date(job.service_date).toLocaleDateString()}
              {job.scheduled_time && ` at ${job.scheduled_time}`}
            </div>
          )}
          {job.notes && (
            <div>
              <span className="font-semibold">Notes: </span>
              {job.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {job.line_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="capitalize">{item.item_type}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                  <TableCell>${item.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteLineItem(item.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${job.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${job.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${job.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payments</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleGenerateInvoice()}
              disabled={
                job?.status !== 'completed' && job?.status !== 'invoiced'
              }
            >
              Generate Invoice
            </Button>
            <Button onClick={() => setPaymentDialogOpen(true)}>
              Record Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Payment Summary */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Total Due:</span>
              <span className="font-semibold">
                ${paymentSummary.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="text-green-600 font-semibold">
                ${paymentSummary.paid.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Remaining Balance:</span>
              <span
                className={`font-bold ${paymentSummary.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                ${paymentSummary.remaining.toFixed(2)}
              </span>
            </div>
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  paymentSummary.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : paymentSummary.status === 'partial'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {paymentSummary.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{payment.payment_method || '-'}</TableCell>
                    <TableCell>{payment.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePayment(payment.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No payments recorded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <div className="space-y-6">
        <PhotoUpload
          jobId={params.id as string}
          onPhotoUploaded={handlePhotoUploaded}
        />

        <PhotoGallery photos={photos} onPhotoDeleted={handlePhotoDeleted} />
      </div>

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSubmit={handleRecordPayment}
        remainingBalance={paymentSummary.remaining}
      />
    </div>
  );
}
