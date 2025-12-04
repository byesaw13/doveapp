'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  MessageSquare,
  Mail,
  PhoneCall,
  FileText,
  CheckCircle2,
  DollarSign,
  CalendarCheck,
  Briefcase,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import type { ClientActivity } from '@/types/activity';

interface ActivityTimelineProps {
  clientId: string;
}

const activityIcons: Record<string, React.ReactElement> = {
  note: <FileText className="w-4 h-4 text-blue-600" />,
  email_sent: <Mail className="w-4 h-4 text-blue-600" />,
  email_received: <Mail className="w-4 h-4 text-green-600" />,
  call: <PhoneCall className="w-4 h-4 text-purple-600" />,
  meeting: <CalendarCheck className="w-4 h-4 text-amber-600" />,
  job_created: <Briefcase className="w-4 h-4 text-blue-600" />,
  job_completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  job_cancelled: <AlertTriangle className="w-4 h-4 text-red-600" />,
  estimate_sent: <FileText className="w-4 h-4 text-indigo-600" />,
  estimate_accepted: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  estimate_declined: <AlertTriangle className="w-4 h-4 text-red-600" />,
  payment_received: <DollarSign className="w-4 h-4 text-emerald-600" />,
  property_added: <MessageSquare className="w-4 h-4 text-orange-600" />,
  default: <MessageSquare className="w-4 h-4 text-gray-500" />,
};

const activityLabels: Record<string, string> = {
  note: 'Note',
  email_sent: 'Email Sent',
  email_received: 'Email Received',
  call: 'Call',
  meeting: 'Meeting',
  job_created: 'Job Created',
  job_completed: 'Job Completed',
  job_cancelled: 'Job Cancelled',
  estimate_sent: 'Estimate Sent',
  estimate_accepted: 'Estimate Accepted',
  estimate_declined: 'Estimate Declined',
  payment_received: 'Payment Received',
  property_added: 'Property Added',
};

export function ActivityTimeline({ clientId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('Quick note');
  const [noteDescription, setNoteDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    return activities.filter((activity) => activity.activity_type === filter);
  }, [activities, filter]);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/clients/${clientId}/activities?limit=200`
      );
      if (!response.ok) {
        throw new Error('Failed to load activities');
      }
      const data = await response.json();
      setActivities(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadActivities();
    }
  }, [clientId]);

  const handleAddNote = async () => {
    if (!noteDescription.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'note',
          title: noteTitle || 'Quick note',
          description: noteDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      setNoteTitle('Quick note');
      setNoteDescription('');
      await loadActivities();
    } catch (error) {
      console.error(error);
      setError('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const renderActivity = (activity: ClientActivity) => {
    const icon = activityIcons[activity.activity_type] || activityIcons.default;
    const label =
      activityLabels[activity.activity_type] || activity.activity_type;

    return (
      <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1 w-px bg-border mt-1" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{label}</Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <h4 className="text-sm font-medium">{activity.title}</h4>
          {activity.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {activity.description}
            </p>
          )}
          {activity.metadata &&
            typeof activity.metadata.amount === 'number' && (
              <p className="text-sm text-muted-foreground">
                Amount: ${activity.metadata.amount.toFixed(2)}
              </p>
            )}

          {activity.created_by && (
            <p className="text-xs text-muted-foreground">
              Logged by {activity.created_by}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Log a Note</CardTitle>
          <CardDescription>
            Keep track of calls, conversations, and important reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Note title"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <Textarea
            placeholder="Add details about your interaction..."
            value={noteDescription}
            onChange={(e) => setNoteDescription(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={handleAddNote}
              disabled={submitting || !noteDescription.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={loadActivities} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Every interaction with this client, in one place
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Filter:</span>
            <div className="flex flex-wrap gap-2">
              {[
                'all',
                'note',
                'email_sent',
                'call',
                'job_created',
                'job_completed',
                'estimate_sent',
                'payment_received',
              ].map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(type)}
                >
                  {type === 'all'
                    ? 'All'
                    : activityLabels[type] || type.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading timeline...
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity recorded yet. Start by logging a note above.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-5 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {filteredActivities.map((activity) => renderActivity(activity))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
