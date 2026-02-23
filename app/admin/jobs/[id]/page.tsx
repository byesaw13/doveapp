'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  PageHeader,
  PageContainer,
  ContentSection,
  ActionPanel,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JobStatus, JobWithDetails, LineItemInsert } from '@/types/job';
import type { Payment } from '@/types/payment';
import type { PaymentFormData } from '@/lib/validations/payment';
import type { JobPhoto } from '@/types/job-photo';
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Calendar,
  Clock,
  User,
  FileText,
  Camera,
  MessageSquare,
  CreditCard,
  CheckCircle,
  PlayCircle,
  FileCheck,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { RecordPaymentDialog } from '../components/RecordPaymentDialog';
import { PhotoUpload } from '../components/PhotoUpload';

const PhotoGallery = dynamic(
  () =>
    import('../components/PhotoGallery').then((mod) => ({
      default: mod.PhotoGallery,
    })),
  { loading: () => <div className="animate-pulse bg-muted h-64 rounded-lg" /> }
);

const statusVariantMap: Record<
  JobStatus,
  | 'draft'
  | 'quote'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'invoiced'
  | 'cancelled'
> = {
  draft: 'draft',
  quote: 'quote',
  scheduled: 'scheduled',
  in_progress: 'in_progress',
  completed: 'completed',
  invoiced: 'invoiced',
  cancelled: 'cancelled',
};

const statusTransitions: Record<
  JobStatus,
  Array<{ to: JobStatus; label: string; icon: React.ReactNode }>
> = {
  draft: [
    {
      to: 'quote',
      label: 'Create Quote',
      icon: <FileText className="h-4 w-4" />,
    },
  ],
  quote: [
    {
      to: 'scheduled',
      label: 'Schedule Job',
      icon: <Calendar className="h-4 w-4" />,
    },
  ],
  scheduled: [
    {
      to: 'in_progress',
      label: 'Start Job',
      icon: <PlayCircle className="h-4 w-4" />,
    },
  ],
  in_progress: [
    {
      to: 'completed',
      label: 'Mark Complete',
      icon: <CheckCircle className="h-4 w-4" />,
    },
  ],
  completed: [
    {
      to: 'invoiced',
      label: 'Create Invoice',
      icon: <FileCheck className="h-4 w-4" />,
    },
  ],
  invoiced: [],
  cancelled: [],
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [job, setJob] = React.useState<JobWithDetails | null>(null);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = React.useState({
    total: 0,
    paid: 0,
    remaining: 0,
    status: 'unpaid' as 'unpaid' | 'partial' | 'paid',
  });
  const [photos, setPhotos] = React.useState<JobPhoto[]>([]);
  const [notes, setNotes] = React.useState<any[]>([]);
  const [techs, setTechs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<JobStatus | null>(
    null
  );
  const [statusUpdating, setStatusUpdating] = React.useState(false);

  React.useEffect(() => {
    loadJob();
  }, [params.id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobRes, paymentsRes, photosRes, notesRes, techsRes] =
        await Promise.all([
          fetch(`/api/jobs/${params.id}`),
          fetch(`/api/jobs/${params.id}/payments`),
          fetch(`/api/jobs/${params.id}/photos`),
          fetch(`/api/jobs/${params.id}/notes`),
          fetch('/api/admin/users?role=TECH'),
        ]);

      if (!jobRes.ok) throw new Error('Failed to fetch job');

      const jobData = await jobRes.json();
      setJob(jobData);

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
        setPaymentSummary(
          paymentsData.summary || {
            total: 0,
            paid: 0,
            remaining: 0,
            status: 'unpaid',
          }
        );
      }

      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setPhotos(photosData || []);
      }

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData || []);
      }

      if (techsRes.ok) {
        const techsData = await techsRes.json();
        setTechs(techsData || []);
      }
    } catch (err) {
      console.error('Failed to load job:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    setPendingStatus(newStatus);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!job || !pendingStatus) return;

    try {
      setStatusUpdating(true);
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pendingStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Status Updated',
        description: `Job moved to ${pendingStatus.replace('_', ' ')}`,
      });

      await loadJob();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setStatusUpdating(false);
      setStatusDialogOpen(false);
      setPendingStatus(null);
    }
  };

  const handleCreateInvoice = async () => {
    if (!job) return;

    try {
      const response = await fetch(`/api/jobs/${job.id}/invoice`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.exists) {
        toast({
          title: 'Invoice exists',
          description: 'Redirecting to invoice...',
        });
        router.push(`/invoices/${result.invoice_id}`);
        return;
      }

      if (!response.ok)
        throw new Error(result.error || 'Failed to create invoice');

      toast({
        title: 'Invoice Created',
        description: `Invoice ${result.invoice_number} created`,
      });
      router.push(`/invoices/${result.id}`);
    } catch (err) {
      console.error('Failed to create invoice:', err);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    }
  };

  const handleRecordPayment = async (data: PaymentFormData) => {
    if (!job) return;

    try {
      const response = await fetch(`/api/jobs/${job.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data.amount,
          payment_method: data.payment_method || null,
          payment_date: data.payment_date,
          notes: data.notes || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to record payment');

      toast({
        title: 'Payment Recorded',
        description: `$${data.amount.toFixed(2)} payment recorded`,
      });
      setPaymentDialogOpen(false);
      await loadJob();
    } catch (err) {
      console.error('Failed to record payment:', err);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const handleAssignTech = async (techId: string) => {
    if (!job) return;

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_tech_id: techId || null }),
      });

      if (!response.ok) throw new Error('Failed to assign tech');

      toast({ title: 'Updated', description: 'Technician assigned' });
      await loadJob();
    } catch (err) {
      console.error('Failed to assign tech:', err);
      toast({
        title: 'Error',
        description: 'Failed to assign technician',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLineItem = async (itemId: string) => {
    if (!job || !confirm('Delete this line item?')) return;

    try {
      const response = await fetch(`/api/jobs/${job.id}/line-items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete line item');
      toast({ title: 'Deleted', description: 'Line item removed' });
      await loadJob();
    } catch (err) {
      console.error('Failed to delete line item:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete line item',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoUploaded = (photo: JobPhoto) =>
    setPhotos((prev) => [...prev, photo]);
  const handlePhotoDeleted = (photoId: string) =>
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));

  if (loading) {
    return (
      <PageContainer maxWidth="xl">
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error || !job) {
    return (
      <PageContainer maxWidth="xl">
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="Job not found"
          description={error || 'The requested job could not be found.'}
          action={{
            label: 'Back to Jobs',
            onClick: () => router.push('/admin/jobs'),
          }}
        />
      </PageContainer>
    );
  }

  const transitions = statusTransitions[job.status] || [];
  const clientName = `${job.client.first_name} ${job.client.last_name}`;

  return (
    <PageContainer maxWidth="xl" padding="none">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/jobs')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold truncate">
                    #{job.job_number}
                  </h1>
                  <StatusBadge
                    variant={statusVariantMap[job.status]}
                    size="sm"
                    dot
                  >
                    {job.status.replace('_', ' ')}
                  </StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {job.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/jobs/${job.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              {transitions.map((t) => (
                <ButtonLoader
                  key={t.to}
                  size="sm"
                  onClick={() => handleStatusChange(t.to)}
                  loading={statusUpdating && pendingStatus === t.to}
                >
                  {t.icon}
                  <span className="ml-2 hidden sm:inline">{t.label}</span>
                </ButtonLoader>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:flex lg:gap-6 px-4 lg:px-6 py-6">
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">{clientName}</p>
                {job.client.company_name && (
                  <p className="text-sm text-muted-foreground">
                    {job.client.company_name}
                  </p>
                )}
                {job.client.email && (
                  <a
                    href={`mailto:${job.client.email}`}
                    className="text-sm text-primary hover:underline block"
                  >
                    {job.client.email}
                  </a>
                )}
                {job.client.phone && (
                  <a
                    href={`tel:${job.client.phone}`}
                    className="text-sm text-primary hover:underline block"
                  >
                    {job.client.phone}
                  </a>
                )}
                {job.client.address_line1 && (
                  <p className="text-sm text-muted-foreground">
                    {job.client.address_line1}
                    {job.client.city && `, ${job.client.city}`}
                    {job.client.state && `, ${job.client.state}`}
                    {job.client.zip_code && ` ${job.client.zip_code}`}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {job.service_date ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(job.service_date), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Not scheduled</p>
                )}
                {job.scheduled_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{job.scheduled_time}</span>
                  </div>
                )}
                <div className="pt-2">
                  <label className="text-xs text-muted-foreground">
                    Assigned Tech
                  </label>
                  <Select
                    value={job.assigned_tech_id || ''}
                    onValueChange={handleAssignTech}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {techs.map((tech: any) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.full_name || tech.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {job.description && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </CardContent>
                </Card>
              )}
              {job.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
                  </CardContent>
                </Card>
              )}
              <PhotoUpload
                jobId={params.id as string}
                onPhotoUploaded={handlePhotoUploaded}
              />
              {photos.length > 0 && (
                <PhotoGallery
                  photos={photos}
                  onPhotoDeleted={handlePhotoDeleted}
                />
              )}
            </TabsContent>

            <TabsContent value="items" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {job.line_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="capitalize">
                            {item.item_type}
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.unit_price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${item.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteLineItem(item.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <div className="mt-4 flex justify-end">
                <Card className="w-64">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${job.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${job.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total</span>
                      <span>${job.total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Due</p>
                    <p className="text-2xl font-bold">
                      ${paymentSummary.total.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${paymentSummary.paid.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${paymentSummary.remaining.toFixed(2)}
                    </p>
                    <StatusBadge
                      variant={
                        paymentSummary.status === 'paid'
                          ? 'paid'
                          : paymentSummary.status === 'partial'
                            ? 'partial'
                            : 'unpaid'
                      }
                      size="sm"
                      className="mt-2"
                    >
                      {paymentSummary.status}
                    </StatusBadge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payment History</CardTitle>
                  <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {payments.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No payments recorded
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {format(
                                new Date(payment.payment_date),
                                'MMM d, yyyy'
                              )}
                            </TableCell>
                            <TableCell>
                              {payment.payment_method || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${payment.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity & Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {notes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No activity yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {notes.map((note: any) => (
                        <div
                          key={note.id}
                          className="border-l-2 border-primary/20 pl-4 py-2"
                        >
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {note.user?.full_name || note.user?.email} •{' '}
                            {format(
                              new Date(note.created_at),
                              'MMM d, yyyy h:mm a'
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Job #</span>
                  <span className="font-medium">{job.job_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge variant={statusVariantMap[job.status]} size="sm">
                    {job.status.replace('_', ' ')}
                  </StatusBadge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">${job.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <StatusBadge
                    variant={
                      paymentSummary.status === 'paid'
                        ? 'paid'
                        : paymentSummary.status === 'partial'
                          ? 'partial'
                          : 'unpaid'
                    }
                    size="sm"
                  >
                    {paymentSummary.status}
                  </StatusBadge>
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
                  asChild
                >
                  <Link href={`/admin/jobs/${job.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Job
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
                {(job.status === 'completed' || job.status === 'invoiced') && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleCreateInvoice}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {job.status === 'invoiced'
                      ? 'View Invoice'
                      : 'Create Invoice'}
                  </Button>
                )}
                {transitions.map((t) => (
                  <ButtonLoader
                    key={t.to}
                    variant="default"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange(t.to)}
                    loading={statusUpdating && pendingStatus === t.to}
                  >
                    {t.icon}
                    <span className="ml-2">{t.label}</span>
                  </ButtonLoader>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
        <div className="flex gap-2">
          {transitions.map((t) => (
            <ButtonLoader
              key={t.to}
              className="flex-1"
              onClick={() => handleStatusChange(t.to)}
              loading={statusUpdating && pendingStatus === t.to}
            >
              {t.icon}
              <span className="ml-2">{t.label}</span>
            </ButtonLoader>
          ))}
          <Button variant="outline" asChild>
            <Link href={`/admin/jobs/${job.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSubmit={handleRecordPayment}
        remainingBalance={paymentSummary.remaining}
      />

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Change job status to {pendingStatus?.replace('_', ' ')}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={statusUpdating}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
