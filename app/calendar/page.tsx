'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

import { getJobs, updateJob, createJob } from '@/lib/db/jobs';
import { getClients } from '@/lib/db/clients';
import { JobWithClient } from '@/types/job';
import type { Client } from '@/types/client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Clock,
  User,
  Plus,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Create drag and drop calendar
const DnDCalendar = withDragAndDrop(Calendar);

// Custom event component for the calendar
const EventComponent: React.ComponentType<EventProps<object>> = ({ event }) => {
  const typedEvent = event as {
    title: string;
    resource: { status: string };
    clientName: string;
  };

  return (
    <div className="text-white text-xs p-1.5 rounded-md h-full overflow-hidden">
      <div className="font-semibold truncate">{typedEvent.title}</div>
      <div className="opacity-90 text-[10px] truncate">
        {typedEvent.clientName}
      </div>
    </div>
  );
};

// Custom toolbar component with Jobber styling
const CustomToolbar: React.ComponentType<ToolbarProps<object, object>> = ({
  label,
  onNavigate,
  onView,
  view,
}) => {
  return (
    <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('PREV' as NavigateAction)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-300"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 min-w-[200px] text-center">
            {label}
          </h2>
          <button
            onClick={() => onNavigate('NEXT' as NavigateAction)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-300"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => onNavigate('TODAY' as NavigateAction)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onView('month' as View)}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              view === 'month'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => onView('week' as View)}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              view === 'week'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => onView('day' as View)}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              view === 'day'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => onView('agenda' as View)}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              view === 'agenda'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragSuccess, setDragSuccess] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    clientId: '',
    startTime: '09:00',
    endTime: '10:00',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const [jobsData, clientsData] = await Promise.all([
        getJobs(),
        getClients(),
      ]);
      setJobs(jobsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar data. Please refresh the page.',
        variant: 'destructive',
      });
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
          clientName: job.client
            ? `${job.client.first_name} ${job.client.last_name}`
            : 'Quick Event',
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

      setDragSuccess(
        `"${event.title}" rescheduled to ${format(start, 'PPP')} at ${format(start, 'p')}`
      );
      setTimeout(() => setDragSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to reschedule job:', error);
      toast({
        title: 'Error',
        description: 'Failed to reschedule job. Please try again.',
        variant: 'destructive',
      });
      loadJobs();
    }
  };

  const handleEventResize = async ({ event, start, end }: any) => {
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
        description: 'Job time has been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update job time:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job time. Please try again.',
        variant: 'destructive',
      });
      loadJobs();
    }
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !eventForm.clientId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client for this event.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreatingEvent(true);

      const serviceDate = format(selectedSlot.start, 'yyyy-MM-dd');
      const startTime = eventForm.startTime || '09:00';
      const endTime = eventForm.endTime || '10:00';

      // Create a basic job with minimal required fields
      await createJob(
        {
          client_id: eventForm.clientId,
          property_id: null,
          title: eventForm.title,
          description: eventForm.description || null,
          status: 'scheduled',
          service_date: serviceDate,
          scheduled_time: startTime,
          notes: `Quick event created from calendar. End time: ${endTime}`,
          subtotal: 0,
          tax: 0,
          total: 0,
        },
        [] // No line items for quick events
      );

      // Reload jobs to show the new event
      await loadJobs();

      // Close modal and reset form
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
        description: `"${eventForm.title}" has been scheduled for ${format(selectedSlot.start, 'PPP')}`,
      });
    } catch (error) {
      console.error('Failed to create event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingEvent(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      quote: 'bg-gray-100 text-gray-800 border-gray-300',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      invoiced: 'bg-purple-100 text-purple-800 border-purple-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };

    return (
      <Badge
        variant="outline"
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <div className="text-slate-600 font-medium">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Jobber style with emerald gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-10 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white">Calendar</h1>
              <p className="mt-2 text-emerald-50 text-sm">
                Drag & drop to reschedule • Click events for details
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/jobs/new">
                <button className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-500 inline-flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  New Job
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification - Jobber style */}
      {dragSuccess && (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-800 mb-1">
                Job Rescheduled
              </h3>
              <p className="text-sm text-emerald-700">{dragSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {/* Legend - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Job Status Legend
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm font-medium text-slate-700">
              Scheduled
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm font-medium text-slate-700">
              In Progress
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm font-medium text-slate-700">
              Completed
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm font-medium text-slate-700">
              Cancelled
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span className="text-sm font-medium text-slate-700">Quote</span>
          </div>
        </div>
      </div>

      {/* Calendar - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md">
        <div className="p-0">
          <div className="calendar-wrapper" style={{ height: '700px' }}>
            <DnDCalendar
              localizer={localizer}
              events={events}
              startAccessor={(event: any) => new Date(event.start)}
              endAccessor={(event: any) => new Date(event.end)}
              date={currentDate}
              onNavigate={handleNavigate}
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
              eventPropGetter={(event: any) => {
                const typedEvent = event as { resource: { status: string } };
                const statusColors = {
                  scheduled: {
                    style: {
                      backgroundColor: '#3b82f6',
                      borderRadius: '6px',
                      border: 'none',
                      boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
                    },
                  },
                  in_progress: {
                    style: {
                      backgroundColor: '#eab308',
                      borderRadius: '6px',
                      border: 'none',
                      boxShadow: '0 1px 3px rgba(234, 179, 8, 0.3)',
                    },
                  },
                  completed: {
                    style: {
                      backgroundColor: '#22c55e',
                      borderRadius: '6px',
                      border: 'none',
                      boxShadow: '0 1px 3px rgba(34, 197, 94, 0.3)',
                    },
                  },
                  cancelled: {
                    style: {
                      backgroundColor: '#ef4444',
                      borderRadius: '6px',
                      border: 'none',
                      boxShadow: '0 1px 3px rgba(239, 68, 68, 0.3)',
                    },
                  },
                  quote: {
                    style: {
                      backgroundColor: '#6b7280',
                      borderRadius: '6px',
                      border: 'none',
                      boxShadow: '0 1px 3px rgba(107, 114, 128, 0.3)',
                    },
                  },
                };
                return (
                  statusColors[
                    typedEvent.resource.status as keyof typeof statusColors
                  ] || {
                    style: {
                      backgroundColor: '#6b7280',
                      borderRadius: '6px',
                      border: 'none',
                    },
                  }
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* Job Details Modal - Jobber style */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-2xl bg-white border-slate-200">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {selectedEvent?.title}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Job #{selectedEvent?.resource?.job_number}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              {/* Status and Client */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </label>
                  <div className="mt-2">
                    {getStatusBadge(selectedEvent.status)}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Client
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="p-1 bg-slate-200 rounded">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-slate-900">
                      {selectedEvent.clientName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Service Date
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="p-1 bg-slate-200 rounded">
                      <CalendarDays className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-slate-900">
                      {format(selectedEvent.start, 'PPP')}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Scheduled Time
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="p-1 bg-slate-200 rounded">
                      <Clock className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-slate-900">
                      {selectedEvent.resource?.scheduled_time
                        ? format(
                            parseISO(
                              `${selectedEvent.resource.service_date}T${selectedEvent.resource.scheduled_time}`
                            ),
                            'p'
                          )
                        : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedEvent.resource?.description && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Description
                  </label>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                    {selectedEvent.resource.description}
                  </p>
                </div>
              )}

              {/* Total Value - Highlighted */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border-2 border-emerald-200">
                <label className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  Total Value
                </label>
                <p className="mt-1 text-3xl font-bold text-emerald-600">
                  ${selectedEvent.total?.toFixed(2) || '0.00'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <Link href={`/jobs/${selectedEvent.id}`} className="flex-1">
                  <button className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors">
                    View Full Details
                  </button>
                </Link>
                <Link
                  href={`/jobs/${selectedEvent.id}/edit`}
                  className="flex-1"
                >
                  <button className="w-full px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors">
                    Edit Job
                  </button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Event Creation Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Create Event
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  {selectedSlot && format(selectedSlot.start, 'PPP')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Event title"
                value={eventForm.title}
                onChange={(e) =>
                  setEventForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Client
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                value={eventForm.clientId}
                onChange={(e) =>
                  setEventForm((prev) => ({
                    ...prev,
                    clientId: e.target.value,
                  }))
                }
              >
                <option value="">Select a client *</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                    {client.company_name && ` - ${client.company_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Event description (optional)"
                rows={3}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedSlot(null);
                  setEventForm({
                    title: '',
                    description: '',
                    clientId: '',
                    startTime: '09:00',
                    endTime: '10:00',
                  });
                }}
                className="flex-1 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingEvent}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {creatingEvent ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .calendar-wrapper .rbc-calendar {
          font-family: inherit;
        }

        .calendar-wrapper .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          font-size: 14px;
          background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
          border-bottom: 2px solid #e2e8f0;
          color: #475569;
        }

        .calendar-wrapper .rbc-today {
          background-color: #f0f9ff;
        }

        .calendar-wrapper .rbc-off-range-bg {
          background-color: #fafafa;
        }

        .calendar-wrapper .rbc-date-cell {
          padding: 6px 8px;
          font-size: 13px;
        }

        .calendar-wrapper .rbc-date-cell.rbc-now {
          font-weight: 700;
        }

        .calendar-wrapper .rbc-date-cell > a {
          color: #1e293b;
        }

        .calendar-wrapper .rbc-today .rbc-date-cell > a {
          color: #059669;
          font-weight: 700;
        }

        .calendar-wrapper .rbc-event {
          padding: 4px 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          border: none !important;
        }

        .calendar-wrapper .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
        }

        .calendar-wrapper .rbc-event-label {
          font-size: 11px;
        }

        .calendar-wrapper .rbc-month-view {
          border: none;
          border-radius: 12px;
          overflow: hidden;
        }

        .calendar-wrapper .rbc-month-row {
          border: 1px solid #e2e8f0;
          border-top: none;
          min-height: 100px;
        }

        .calendar-wrapper .rbc-day-bg {
          border-left: 1px solid #e2e8f0;
        }

        .calendar-wrapper .rbc-day-bg:first-child {
          border-left: none;
        }

        .calendar-wrapper .rbc-month-view .rbc-header {
          border-bottom: none;
        }

        .calendar-wrapper .rbc-time-view {
          border: none;
        }

        .calendar-wrapper .rbc-time-header {
          border-left: 1px solid #e2e8f0;
        }

        .calendar-wrapper .rbc-time-content {
          border-top: 1px solid #e2e8f0;
        }

        .calendar-wrapper .rbc-timeslot-group {
          min-height: 60px;
        }

        .calendar-wrapper .rbc-current-time-indicator {
          background-color: #10b981;
          height: 2px;
        }

        .calendar-wrapper .rbc-agenda-view {
          padding: 16px;
        }

        .calendar-wrapper .rbc-agenda-table {
          border-radius: 12px;
          overflow: hidden;
        }

        .calendar-wrapper .rbc-agenda-date-cell {
          padding: 12px;
          background: #f8fafc;
          font-weight: 600;
        }

        .calendar-wrapper .rbc-agenda-time-cell {
          padding: 12px;
        }

        .calendar-wrapper .rbc-agenda-event-cell {
          padding: 12px;
        }
      `}</style>
    </div>
  );
}
