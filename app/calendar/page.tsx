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
  NavigateAction,
} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { format, parseISO, endOfDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

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
    resource: { status: string; client: string };
  };

  return (
    <div className="text-white text-xs p-1.5 rounded-md h-full overflow-hidden">
      <div className="font-semibold truncate">{typedEvent.title}</div>
      <div className="opacity-90 text-[10px] truncate">
        {typedEvent.resource?.client}
      </div>
    </div>
  );
};

// Custom toolbar component with improved styling
const CustomToolbar: React.ComponentType<ToolbarProps<object, object>> = ({
  label,
  onNavigate,
  onView,
  view,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('PREV' as NavigateAction)}
          className="h-9 px-3 hover:bg-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold text-gray-800 min-w-[200px] text-center">
          {label}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('NEXT' as NavigateAction)}
          className="h-9 px-3 hover:bg-white"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('TODAY' as NavigateAction)}
          className="h-9 px-4 hover:bg-white font-medium"
        >
          Today
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={view === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('month' as View)}
          className="h-9"
        >
          Month
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('week' as View)}
          className="h-9"
        >
          Week
        </Button>
        <Button
          variant={view === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('day' as View)}
          className="h-9"
        >
          Day
        </Button>
        <Button
          variant={view === 'agenda' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onView('agenda' as View)}
          className="h-9"
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
  const [currentDate, setCurrentDate] = useState(new Date());
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
      toast({
        title: 'Error',
        description: 'Failed to load jobs. Please refresh the page.',
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
    toast({
      title: 'Time Slot Selected',
      description: `Click "New Job" to schedule something for ${format(start, 'PPP')}`,
    });
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-600 font-medium">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Calendar
              </h1>
              <p className="text-gray-600 mt-1">
                Drag & drop to reschedule • Click events for details
              </p>
            </div>
            <Link href="/jobs/new">
              <Button size="lg" className="shadow-md hover:shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                New Job
              </Button>
            </Link>
          </div>

          {/* Success Notification */}
          {dragSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm mb-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium text-green-800">
                  {dragSuccess}
                </p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
            <span className="text-sm font-medium text-gray-700">
              Job Status:
            </span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm text-gray-600">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-600">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-gray-600">Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500"></div>
              <span className="text-sm text-gray-600">Quote</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-0">
            <div className="calendar-wrapper" style={{ height: '700px' }}>
              <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
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
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="w-6 h-6 text-blue-600" />
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Job #{selectedEvent?.resource?.job_number}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 mt-4">
              {/* Status and Client */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Status
                  </label>
                  <div className="mt-2">
                    {getStatusBadge(selectedEvent.status)}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Client
                  </label>
                  <div className="mt-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">
                      {selectedEvent.clientName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Service Date
                  </label>
                  <div className="mt-2 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">
                      {format(selectedEvent.start, 'PPP')}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Scheduled Time
                  </label>
                  <div className="mt-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">
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
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Description
                  </label>
                  <p className="mt-2 text-sm text-gray-700">
                    {selectedEvent.resource.description}
                  </p>
                </div>
              )}

              {/* Total */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <label className="text-xs font-medium text-gray-600 uppercase">
                  Total Value
                </label>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  ${selectedEvent.total?.toFixed(2) || '0.00'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Link href={`/jobs/${selectedEvent.id}`} className="flex-1">
                  <Button className="w-full">View Full Details</Button>
                </Link>
                <Link
                  href={`/jobs/${selectedEvent.id}/edit`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    Edit Job
                  </Button>
                </Link>
              </div>
            </div>
          )}
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
          background-color: #eff6ff;
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
          color: #2563eb;
          font-weight: 700;
        }

        .calendar-wrapper .rbc-event {
          padding: 4px 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .calendar-wrapper .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }

        .calendar-wrapper .rbc-event-label {
          font-size: 11px;
        }

        .calendar-wrapper .rbc-month-view {
          border: none;
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-wrapper .rbc-month-row {
          border: 1px solid #e5e7eb;
          border-top: none;
          min-height: 100px;
        }

        .calendar-wrapper .rbc-day-bg {
          border-left: 1px solid #e5e7eb;
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
          border-left: 1px solid #e5e7eb;
        }

        .calendar-wrapper .rbc-time-content {
          border-top: 1px solid #e5e7eb;
        }

        .calendar-wrapper .rbc-timeslot-group {
          min-height: 60px;
        }

        .calendar-wrapper .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }

        .calendar-wrapper .rbc-agenda-view {
          padding: 16px;
        }

        .calendar-wrapper .rbc-agenda-table {
          border-radius: 8px;
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
