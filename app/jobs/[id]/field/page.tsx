'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import type { JobWithDetails, JobStatus } from '@/types/job';
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Square,
  Phone,
} from 'lucide-react';

export default function JobFieldViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fieldNotes, setFieldNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const jobId = params.id as string;

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) throw new Error('Failed to load job');
      const data = await response.json();
      setJob(data);
      setFieldNotes(data.internal_notes || '');
    } catch (error) {
      console.error('Failed to load job:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Status Updated',
        description: `Job status changed to ${newStatus.replace('_', ' ')}`,
      });

      loadJob(); // Refresh data
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!job) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalNotes: fieldNotes,
        }),
      });

      if (!response.ok) throw new Error('Failed to save notes');

      toast({
        title: 'Notes Saved',
        description: 'Field notes have been saved successfully',
      });
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save field notes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: JobStatus) => {
    const colors: Record<JobStatus, string> = {
      draft: 'bg-gray-100 text-gray-700',
      quote: 'bg-blue-100 text-blue-700',
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      invoiced: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatScheduledTime = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Job Not Found
          </h1>
          <Button onClick={() => router.push('/jobs')}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/jobs/${jobId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Badge className={`px-3 py-1 ${getStatusColor(job.status)}`}>
              {job.status
                .replace('_', ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {job.job_number}
            </h1>
            <p className="text-gray-600 mt-1">{job.title}</p>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">
                  {job.client?.first_name} {job.client?.last_name}
                </p>
                {job.client?.phone && (
                  <a
                    href={`tel:${job.client.phone}`}
                    className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    {job.client.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {formatScheduledTime(job.scheduled_for)}
            </p>
          </CardContent>
        </Card>

        {/* Scope & Line Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Scope of Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {job.job_line_items && job.job_line_items.length > 0 ? (
                job.job_line_items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0"
                  >
                    <p className="font-medium text-gray-900">
                      {item.description}
                    </p>
                    <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                      <span>Qty: {item.quantity}</span>
                      {item.tier && <span>Tier: {item.tier}</span>}
                      <span className="font-medium">
                        $
                        {item.total?.toFixed(2) ||
                          item.line_total?.toFixed(2) ||
                          '0.00'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No line items</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Field Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Field Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              placeholder="Add notes about work performed, issues encountered, etc..."
              rows={4}
              className="text-base"
            />
            <Button
              onClick={handleSaveNotes}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {job.status === 'scheduled' && (
            <Button
              onClick={() => handleStatusChange('in_progress')}
              disabled={saving}
              className="w-full h-14 text-lg flex items-center gap-3 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-6 h-6" />
              Start Job
            </Button>
          )}

          {job.status === 'in_progress' && (
            <Button
              onClick={() => handleStatusChange('completed')}
              disabled={saving}
              className="w-full h-14 text-lg flex items-center gap-3 bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-6 h-6" />
              Mark as Completed
            </Button>
          )}

          {job.status === 'draft' && (
            <div className="text-center py-4">
              <p className="text-gray-600">Job is not yet scheduled</p>
            </div>
          )}

          {(job.status === 'completed' || job.status === 'cancelled') && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                {job.status === 'completed' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <span className="font-medium capitalize">
                  Job {job.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
