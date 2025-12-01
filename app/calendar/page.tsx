'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  Calendar,
  momentLocalizer,
  View,
  Views,
  EventProps,
  ToolbarProps,
} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { format, parseISO, endOfDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { getJobs, updateJob } from '@/lib/db/jobs';
import { JobWithClient } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarDays, Clock, User, Plus, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Create drag and drop calendar
const DnDCalendar = withDragAndDrop(Calendar);

// Custom event component for the calendar
const EventComponent: React.ComponentType<EventProps<object>> = ({ event }) => {
  const typedEvent = event as {
    title: string;
    resource: { status: string; client: string };
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`text-white text-xs p-1 rounded truncate ${getStatusColor(
        typedEvent.resource?.status
      )}`}
    >
      <div className="font-medium">{typedEvent.title}</div>
      <div className="opacity-90">{typedEvent.resource?.client}</div>
    </div>
  );
};

// Custom toolbar component
const CustomToolbar: React.ComponentType<ToolbarProps<object, object>> = ({
  label,
  onNavigate,
  onView,
  view,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 p-4 bg-white border-b">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => onNavigate('PREV')}>
          ‹ Prev
        </Button>
        <h2 className="text-xl font-semibold">{label}</h2>
        <Button variant="outline" onClick={() => onNavigate('NEXT')}>
          Next ›
        </Button>
        <Button variant="outline" onClick={() => onNavigate('TODAY')}>
          Today
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={view === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('month')}
        >
          Month
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('week')}
        >
          Week
        </Button>
        <Button
          variant={view === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('day')}
        >
          Day
        </Button>
        <Button
          variant={view === 'agenda' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('agenda')}
        >
          Agenda
        </Button>
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [dragSuccess, setDragSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await getJobs();
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert jobs to calendar events
  const events = useMemo(() => {
    return jobs
      .filter((job) => job.service_date) // Only jobs with service dates
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
          clientName: `${job.client.first_name} ${job.client.last_name}`,
          status: job.status,
          total: job.total,
        };
      });
  }, [jobs]);

  const handleSelectEvent = (event: object) => {
    setSelectedEvent(event as { id: string });
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Could open a quick job creation dialog here
    toast({
      title: 'Time Slot Selected',
      description: `Selected from ${format(start, 'PPp')} to ${format(end, 'PPp')}`,
    });
  };

  const handleEventDrop = async ({ event, start }: any) => {
    try {
      const typedEvent = event as { id: string; title: string };
      // Update the job's service date and time
      const newServiceDate = format(start, 'yyyy-MM-dd');
      const newScheduledTime = format(start, 'HH:mm:ss');

      // Update the job in the database
      await updateJob(typedEvent.id, {
        service_date: newServiceDate,
        scheduled_time: newScheduledTime,
      });

      // Update local state
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

      // Show success message
      setDragSuccess(
        `Job "${event.title}" rescheduled to ${format(start, 'PPP')} at ${format(start, 'p')}`
      );
      setTimeout(() => setDragSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to reschedule job:', error);
      alert('Failed to reschedule job. Please try again.');
      // Reload jobs to revert the change
      loadJobs();
    }
  };

  const handleEventResize = async ({ event, start }: any) => {
    // For now, we'll just update the end time (duration)
    // In a more advanced implementation, you could update job duration
    try {
      const typedEvent = event as { id: string };
      const newScheduledTime = format(start, 'HH:mm:ss');

      await updateJob(typedEvent.id, {
        scheduled_time: newScheduledTime,
      });

      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === event.id
            ? { ...job, scheduled_time: newScheduledTime }
            : job
        )
      );

      toast({
        title: 'Job Updated',
        description: 'Job duration has been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update job duration:', error);
      alert('Failed to update job duration. Please try again.');
      loadJobs();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      quote: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      invoiced: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <Badge
        className={
          statusColors[status as keyof typeof statusColors] ||
          'bg-gray-100 text-gray-800'
        }
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Schedule and manage your jobs • Drag jobs to reschedule
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {dragSuccess && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {dragSuccess}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <CalendarDays className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Drag & Drop Scheduling
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• Drag jobs to different dates or times to reschedule them</p>
              <p>• Changes are saved automatically when you drop the job</p>
              <p>• Use Week or Day view for more precise time scheduling</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-6">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <DnDCalendar
              localizer={localizer}
              events={events}
              startAccessor={(event: object) =>
                new Date((event as { start: string }).start)
              }
              endAccessor={(event: object) =>
                new Date((event as { end: string }).end)
              }
              style={{ height: '100%' }}
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
              eventPropGetter={(event: object) => {
                const typedEvent = event as { resource: { status: string } };
                const statusColors = {
                  scheduled: { backgroundColor: '#3b82f6' },
                  in_progress: { backgroundColor: '#eab308' },
                  completed: { backgroundColor: '#22c55e' },
                  cancelled: { backgroundColor: '#ef4444' },
                  quote: { backgroundColor: '#6b7280' },
                };
                return {
                  style: statusColors[
                    typedEvent.resource.status as keyof typeof statusColors
                  ] || { backgroundColor: '#6b7280' },
                };
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Job Details Modal */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Job #{selectedEvent?.resource?.job_number}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Status and Client */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedEvent.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Client</label>
                  <div className="mt-1 flex items-center">
                    <User className="w-4 h-4 mr-2 text-muted-foreground" />
                    {selectedEvent.clientName}
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Service Date</label>
                  <div className="mt-1 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                    {format(selectedEvent.start, 'PPP')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Scheduled Time</label>
                  <div className="mt-1 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    {selectedEvent.resource?.scheduled_time || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedEvent.resource?.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedEvent.resource.description}
                  </p>
                </div>
              )}

              {/* Total */}
              <div>
                <label className="text-sm font-medium">Total Value</label>
                <p className="mt-1 text-lg font-semibold">
                  ${selectedEvent.total?.toFixed(2)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Link href={`/jobs/${selectedEvent.id}`}>
                  <Button>View Full Details</Button>
                </Link>
                <Link href={`/jobs/${selectedEvent.id}/edit`}>
                  <Button variant="outline">Edit Job</Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
