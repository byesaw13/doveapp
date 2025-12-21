'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  MapPin,
  Edit,
  Trash2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isWithinInterval,
} from 'date-fns';

interface TeamMember {
  id: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'TECH';
  email: string;
}

interface TeamSchedule {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  schedule_type:
    | 'work'
    | 'meeting'
    | 'training'
    | 'vacation'
    | 'sick'
    | 'personal'
    | 'other';
  is_all_day: boolean;
  location?: string;
  created_by: string;
  created_at: string;
  user?: TeamMember;
}

interface TeamAvailability {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  user?: TeamMember;
}

interface TeamAssignment {
  id: string;
  job_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  scheduled_date?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  job?: {
    id: string;
    job_number: string;
    title: string;
    status: string;
  };
  user?: TeamMember;
}

export function TeamScheduling() {
  const [currentView, setCurrentView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [schedules, setSchedules] = useState<TeamSchedule[]>([]);
  const [availability, setAvailability] = useState<TeamAvailability[]>([]);
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TeamSchedule | null>(
    null
  );
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    start_time: '09:00',
    end_time: '17:00',
    schedule_type: 'work' as TeamSchedule['schedule_type'],
    is_all_day: false,
    location: '',
    user_id: '',
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTeamMembers(),
        loadSchedules(),
        loadAvailability(),
        loadAssignments(),
      ]);
    } catch (error) {
      console.error('Error loading team scheduling data:', error);
      // Don't re-throw - let the component render with empty data
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const startDate = startOfWeek(currentDate);
      const endDate = endOfWeek(currentDate);

      const params = new URLSearchParams({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      const response = await fetch(`/api/admin/team/schedules?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await fetch('/api/admin/team/availability');
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const startDate = startOfWeek(currentDate);
      const endDate = endOfWeek(currentDate);

      const response = await fetch('/api/admin/team/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const response = await fetch('/api/admin/team/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm),
      });

      if (response.ok) {
        await loadSchedules();
        setShowScheduleDialog(false);
        resetScheduleForm();
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    try {
      const response = await fetch(
        `/api/admin/team/schedules/${editingSchedule.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleForm),
        }
      );

      if (response.ok) {
        await loadSchedules();
        setShowScheduleDialog(false);
        setEditingSchedule(null);
        resetScheduleForm();
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule entry?'))
      return;

    try {
      const response = await fetch(`/api/admin/team/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleCreateAvailability = async () => {
    try {
      const response = await fetch('/api/admin/team/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availabilityForm),
      });

      if (response.ok) {
        await loadAvailability();
        setShowAvailabilityDialog(false);
        resetAvailabilityForm();
      }
    } catch (error) {
      console.error('Error creating availability:', error);
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      title: '',
      description: '',
      scheduled_date: '',
      start_time: '09:00',
      end_time: '17:00',
      schedule_type: 'work',
      is_all_day: false,
      location: '',
      user_id: '',
    });
  };

  const resetAvailabilityForm = () => {
    setAvailabilityForm({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
    });
  };

  const openEditSchedule = (schedule: TeamSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      title: schedule.title,
      description: schedule.description || '',
      scheduled_date: schedule.scheduled_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      schedule_type: schedule.schedule_type,
      is_all_day: schedule.is_all_day,
      location: schedule.location || '',
      user_id: schedule.user_id,
    });
    setShowScheduleDialog(true);
  };

  const getScheduleTypeColor = (type: string) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800',
      meeting: 'bg-purple-100 text-purple-800',
      training: 'bg-green-100 text-green-800',
      vacation: 'bg-orange-100 text-orange-800',
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-gray-100 text-gray-800',
      other: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getAssignmentStatusColor = (status: string) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.assigned;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Safe date calculations with error handling
  let weekStart: Date;
  let weekDates: Date[];

  try {
    weekStart = startOfWeek(currentDate);
    weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  } catch (error) {
    console.error('Error calculating week dates:', error);
    // Fallback to current week
    weekStart = startOfWeek(new Date());
    weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate =
      direction === 'next' ? addDays(currentDate, 7) : addDays(currentDate, -7);
    setCurrentDate(newDate);
  };

  const ScheduleDialog = () => (
    <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingSchedule ? 'Edit Schedule' : 'Add Schedule Entry'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="user_id">Team Member</Label>
              <Select
                value={scheduleForm.user_id}
                onValueChange={(value) =>
                  setScheduleForm((prev) => ({ ...prev, user_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="schedule_type">Type</Label>
              <Select
                value={scheduleForm.schedule_type}
                onValueChange={(value: any) =>
                  setScheduleForm((prev) => ({ ...prev, schedule_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={scheduleForm.title}
              onChange={(e) =>
                setScheduleForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Schedule entry title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={scheduleForm.description}
              onChange={(e) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="scheduled_date">Date</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={scheduleForm.scheduled_date}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    scheduled_date: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={scheduleForm.start_time}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
                disabled={scheduleForm.is_all_day}
              />
            </div>

            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={scheduleForm.end_time}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    end_time: e.target.value,
                  }))
                }
                disabled={scheduleForm.is_all_day}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_all_day"
              checked={scheduleForm.is_all_day}
              onChange={(e) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  is_all_day: e.target.checked,
                }))
              }
              className="rounded"
            />
            <Label htmlFor="is_all_day">All day event</Label>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={scheduleForm.location}
              onChange={(e) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              placeholder="Physical location or meeting link"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowScheduleDialog(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={
              editingSchedule ? handleUpdateSchedule : handleCreateSchedule
            }
          >
            {editingSchedule ? 'Update' : 'Create'} Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const AvailabilityDialog = () => (
    <Dialog
      open={showAvailabilityDialog}
      onOpenChange={setShowAvailabilityDialog}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Weekly Availability</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="day_of_week">Day of Week</Label>
            <Select
              value={availabilityForm.day_of_week.toString()}
              onValueChange={(value) =>
                setAvailabilityForm((prev) => ({
                  ...prev,
                  day_of_week: parseInt(value),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="avail_start">Start Time</Label>
              <Input
                id="avail_start"
                type="time"
                value={availabilityForm.start_time}
                onChange={(e) =>
                  setAvailabilityForm((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="avail_end">End Time</Label>
              <Input
                id="avail_end"
                type="time"
                value={availabilityForm.end_time}
                onChange={(e) =>
                  setAvailabilityForm((prev) => ({
                    ...prev,
                    end_time: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_available"
              checked={availabilityForm.is_available}
              onChange={(e) =>
                setAvailabilityForm((prev) => ({
                  ...prev,
                  is_available: e.target.checked,
                }))
              }
              className="rounded"
            />
            <Label htmlFor="is_available">Available during this time</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowAvailabilityDialog(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateAvailability}>Set Availability</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Team Scheduling</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage team schedules, availability, and job assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium">
            {(() => {
              try {
                return `${format(weekStart, 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`;
              } catch (error) {
                console.error('Error formatting dates:', error);
                return 'Week View';
              }
            })()}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAvailabilityDialog(true)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Set Availability
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Week View */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-8 border-l">
              {/* Time column */}
              <div className="border-r bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-500 mb-4">
                  Time
                </div>
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="h-12 text-xs text-gray-400 border-t">
                    {i.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((date, dayIndex) => (
                <div key={dayIndex} className="border-r">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="text-sm font-medium">
                      {weekDays[dayIndex]}
                    </div>
                    <div className="text-lg font-bold">{format(date, 'd')}</div>
                  </div>

                  <div className="relative h-[576px]">
                    {' '}
                    {/* 24 hours * 24px per hour */}
                    {/* Background time slots */}
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div
                        key={hour}
                        className="absolute w-full h-6 border-t border-gray-100"
                        style={{ top: hour * 24 }}
                      />
                    ))}
                    {/* Schedule entries for this day */}
                    {schedules
                      .filter((schedule) => {
                        try {
                          return (
                            isSameDay(
                              new Date(schedule.scheduled_date),
                              date
                            ) &&
                            (selectedMember === 'all' ||
                              !selectedMember ||
                              schedule.user_id === selectedMember)
                          );
                        } catch (error) {
                          console.error(
                            'Error filtering schedule:',
                            error,
                            schedule
                          );
                          return false;
                        }
                      })
                      .map((schedule) => {
                        const startHour = parseInt(
                          schedule.start_time.split(':')[0]
                        );
                        const startMinute = parseInt(
                          schedule.start_time.split(':')[1]
                        );
                        const endHour = parseInt(
                          schedule.end_time.split(':')[0]
                        );
                        const endMinute = parseInt(
                          schedule.end_time.split(':')[1]
                        );

                        const top = startHour * 24 + (startMinute / 60) * 24;
                        const height =
                          (endHour - startHour) * 24 +
                          ((endMinute - startMinute) / 60) * 24;

                        const member = teamMembers.find(
                          (m) => m.id === schedule.user_id
                        );

                        return (
                          <div
                            key={schedule.id}
                            className={`absolute left-1 right-1 rounded p-2 text-xs cursor-pointer ${getScheduleTypeColor(schedule.schedule_type)}`}
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 24)}px`,
                            }}
                            onClick={() => openEditSchedule(schedule)}
                          >
                            <div className="font-medium truncate">
                              {schedule.title}
                            </div>
                            <div className="text-xs opacity-75">
                              {member?.full_name} • {schedule.start_time}-
                              {schedule.end_time}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <ScheduleDialog />

      {/* Availability Dialog */}
      <AvailabilityDialog />
    </div>
  );
}
