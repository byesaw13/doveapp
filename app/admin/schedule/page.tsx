'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  PageContainer,
  EmptyState,
  Spinner,
  Button,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  Calendar,
  momentLocalizer,
  View,
  Views,
  EventProps,
  ToolbarProps,
  NavigateAction,
} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { format, parseISO, endOfDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import { updateJob, createJob } from '@/lib/db/jobs';
import type { JobWithClient, JobStatus } from '@/types/job';
import type { Client } from '@/types/client';

import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const statusVariantMap: Record<
  JobStatus,
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'quote'
  | 'draft'
  | 'invoiced'
> = {
  draft: 'draft',
  quote: 'quote',
  scheduled: 'scheduled',
  in_progress: 'in_progress',
  completed: 'completed',
  invoiced: 'invoiced',
  cancelled: 'cancelled',
};

const EventComponent: React.ComponentType<EventProps<object>> = ({ event }) => {
  const typedEvent = event as {
    title: string;
    resource: { status: JobStatus; job_number: string };
    clientName: string;
  };

  return (
    <div className="text-white text-xs p-1.5 rounded-md h-full overflow-hidden">
      <div className="font-semibold truncate">
        #{typedEvent.resource?.job_number}
      </div>
      <div className="opacity-90 text-[10px] truncate">{typedEvent.title}</div>
    </div>
  );
};

const CustomToolbar: React.ComponentType<ToolbarProps<object, object>> = ({
  label,
  onNavigate,
  onView,
  view,
}) => {
  return (
    <div className="px-4 py-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('PREV' as NavigateAction)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-bold min-w-[180px] text-center">{label}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('NEXT' as NavigateAction)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={() => onNavigate('TODAY' as NavigateAction)}>
          Today
        </Button>
      </div>

      <div className="flex items-center gap-1">
        {(['month', 'week', 'day', 'agenda'] as View[]).map((v) => (
          <Button
            key={v}
            variant={view === v ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView(v)}
            className="capitalize"
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [jobs, setJobs] = React.useState<JobWithClient[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);
  const [currentView, setCurrentView] = React.useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [dragSuccess, setDragSuccess] = React.useState<string | null>(null);
  const [showEventModal, setShowEventModal] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [creatingEvent, setCreatingEvent] = React.useState(false);
  const [eventForm, setEventForm] = React.useState({
    title: '',
    description: '',
    clientId: '',
    startTime: '09:00',
    endTime: '10:00',
  });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, clientsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/clients'),
      ]);

      if (!jobsRes.ok || !clientsRes.ok)
        throw new Error('Failed to fetch data');

      const [jobsData, clientsData] = await Promise.all([
        jobsRes.json(),
        clientsRes.json(),
      ]);

      setJobs(Array.isArray(jobsData) ? jobsData : jobsData.jobs || []);
      setClients(
        Array.isArray(clientsData) ? clientsData : clientsData.clients || []
      );
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const events = React.useMemo(() => {
    return jobs
      .filter((job) => job.service_date)
      .map((job) => {
        const startDate = parseISO(job.service_date!);
        const endDate = job.scheduled_time
          ? parseISO(`${job.service_date}T${job.scheduled_time}`)
          : endOfDay(startDate);

        return {
          id: job.id,
          title: job.title,
          start: startDate,
          end: endDate,
          resource: job,
          clientName: job.client
            ? `${(job.client as any).first_name || ''} ${(job.client as any).last_name || ''}`.trim()
            : 'Unknown',
          status: job.status,
          total: job.total,
        };
      });
  }, [jobs]);

  const handleSelectEvent = (event: object) => {
    setSelectedEvent(event as { id: string });
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setShowEventModal(true);
  };

  const handleEventDrop = async ({ event, start }: any) => {
    try {
      const typedEvent = event as { id: string; title: string };
      const newServiceDate = format(start, 'yyyy-MM-dd');
      const newScheduledTime = format(start, 'HH:mm:ss');

      await updateJob(typedEvent.id, {
        service_date: newServiceDate,
        scheduled_time: newScheduledTime,
      });

      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === event.id
            ? {
                ...job,
                service_date: newServiceDate,
                scheduled_time: newScheduledTime,
              }
            : job
        )
      );

      setDragSuccess(`"${event.title}" rescheduled to ${format(start, 'PPP')}`);
      setTimeout(() => setDragSuccess(null), 3000);

      toast({
        title: 'Job Rescheduled',
        description: `Moved to ${format(start, 'PPP')}`,
      });
    } catch (error) {
      console.error('Failed to reschedule job:', error);
      toast({
        title: 'Error',
        description: 'Failed to reschedule job',
        variant: 'destructive',
      });
      loadData();
    }
  };

  const handleEventResize = async ({ event, start }: any) => {
    try {
      const typedEvent = event as { id: string };
      const newScheduledTime = format(start, 'HH:mm:ss');

      await updateJob(typedEvent.id, { scheduled_time: newScheduledTime });

      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === event.id
            ? { ...job, scheduled_time: newScheduledTime }
            : job
        )
      );

      toast({ title: 'Job Updated', description: 'Job time has been updated' });
    } catch (error) {
      console.error('Failed to update job time:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job time',
        variant: 'destructive',
      });
      loadData();
    }
  };

  const handleNavigate = (newDate: Date) => setCurrentDate(newDate);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !eventForm.clientId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreatingEvent(true);

      const serviceDate = format(selectedSlot.start, 'yyyy-MM-dd');

      await createJob(
        {
          client_id: eventForm.clientId,
          property_id: null,
          title: eventForm.title,
          description: eventForm.description || null,
          status: 'scheduled',
          service_date: serviceDate,
          scheduled_time: eventForm.startTime,
          notes: `Quick event created from calendar. End time: ${eventForm.endTime}`,
          subtotal: 0,
          tax: 0,
          total: 0,
        },
        []
      );

      await loadData();

      setShowEventModal(false);
      setSelectedSlot(null);
      setEventForm({
        title: '',
        description: '',
        clientId: '',
        startTime: '09:00',
        endTime: '10:00',
      });

      toast({
        title: 'Event Created',
        description: `"${eventForm.title}" scheduled for ${format(selectedSlot.start, 'PPP')}`,
      });
    } catch (error) {
      console.error('Failed to create event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setCreatingEvent(false);
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="xl">
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" padding="none">
      <PageHeader
        title="Calendar"
        description="Drag & drop to reschedule, click events for details"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Calendar' },
        ]}
        actions={
          <Button size="sm" asChild>
            <Link href="/admin/jobs/new">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Link>
          </Button>
        }
        className="px-4 lg:px-6"
      />

      {dragSuccess && (
        <div className="mx-4 lg:mx-6 mt-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            {dragSuccess}
          </p>
        </div>
      )}

      <div className="px-4 lg:px-6 py-4">
        <div className="bg-card rounded-lg border shadow-sm">
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor={(event: any) => new Date(event.start)}
            endAccessor={(event: any) => new Date(event.end)}
            date={currentDate}
            onNavigate={handleNavigate}
            style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            components={{
              event: EventComponent,
              toolbar: CustomToolbar,
            }}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            defaultView={Views.MONTH}
            onView={setCurrentView}
            view={currentView}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            resizable
            eventPropGetter={(event: any) => {
              const status = event.resource?.status as JobStatus;
              const colors: Record<JobStatus, string> = {
                scheduled: '#3b82f6',
                in_progress: '#f59e0b',
                completed: '#22c55e',
                cancelled: '#ef4444',
                invoiced: '#8b5cf6',
                quote: '#6b7280',
                draft: '#6b7280',
              };
              return {
                style: {
                  backgroundColor: colors[status] || '#6b7280',
                  borderRadius: '6px',
                  border: 'none',
                },
              };
            }}
          />
        </div>
      </div>

      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Job #{selectedEvent?.resource?.job_number}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge
                    variant={
                      statusVariantMap[selectedEvent.status as JobStatus]
                    }
                    size="sm"
                    className="mt-1"
                  >
                    {selectedEvent.status.replace('_', ' ')}
                  </StatusBadge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium flex items-center gap-1 mt-1">
                    <User className="h-3 w-3" />
                    {selectedEvent.clientName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(selectedEvent.start, 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedEvent.resource?.scheduled_time || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  ${selectedEvent.total?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" asChild>
                  <Link href={`/admin/jobs/${selectedEvent.id}`}>
                    View Details
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/admin/jobs/${selectedEvent.id}/edit`}>
                    Edit
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Quick Event</DialogTitle>
            <DialogDescription>
              {selectedSlot && format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                placeholder="Event title"
                value={eventForm.title}
                onChange={(e) =>
                  setEventForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Client *</label>
              <select
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary bg-background"
                value={eventForm.clientId}
                onChange={(e) =>
                  setEventForm((prev) => ({
                    ...prev,
                    clientId: e.target.value,
                  }))
                }
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                    {client.company_name && ` - ${client.company_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                placeholder="Optional description"
                rows={2}
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                  value={eventForm.startTime}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                  value={eventForm.endTime}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedSlot(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={creatingEvent}>
                {creatingEvent ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
