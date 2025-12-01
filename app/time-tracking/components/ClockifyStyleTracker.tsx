'use client';

import { useState, useEffect } from 'react';
import type { JobWithClient } from '@/types/job';
import type { TimeEntry as DBTimeEntry } from '@/types/time-tracking';
import { Play, Pause, Plus, Edit3, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TimeEntry {
  id: string;
  job_id: string | null;
  technician_name: string;
  description: string;
  start_time: Date;
  end_time: Date | null;
  duration: number; // in seconds
  status: 'active' | 'completed' | 'approved' | 'rejected' | 'paid';
  hourly_rate?: number;
}

interface Project {
  id: string;
  name: string;
  client?: string;
  color: string;
}

// Predefined colors for jobs
const JOB_COLORS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#EC4899',
  '#6B7280',
];

const TECHNICIAN_NAME = 'Demo Technician'; // TODO: Get from auth context

export function ClockifyStyleTracker() {
  // Simple toast replacement
  const toast = ({
    title,
    description,
    variant,
  }: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  }) => {
    const level = variant === 'destructive' ? 'error' : 'info';
    console.log(`[${level}] ${title}: ${description}`);
    // You can replace this with your preferred notification system
  };
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle hydration and update time
  useEffect(() => {
    setIsHydrated(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load jobs on component mount
  useEffect(() => {
    loadJobs();
    loadTodaysEntries();
    checkForActiveEntry();
  }, []);

  // Calculate current entry duration (computed in render to avoid infinite loops)
  const currentEntryDuration =
    currentEntry && isRunning && currentTime
      ? Math.floor(
          (currentTime.getTime() - currentEntry.start_time.getTime()) / 1000
        )
      : currentEntry?.duration || 0;

  // Load jobs from API
  const loadJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();

      if (response.ok) {
        // Convert jobs to projects format with colors
        const jobProjects: Project[] = data.jobs.map(
          (job: JobWithClient, index: number) => ({
            id: job.id,
            name: job.title,
            client: `${job.client.first_name} ${job.client.last_name}`,
            color: JOB_COLORS[index % JOB_COLORS.length],
          })
        );

        // Add common non-job projects
        const commonProjects: Project[] = [
          { id: 'admin', name: 'Admin Tasks', color: '#6B7280' },
          { id: 'travel', name: 'Travel Time', color: '#F59E0B' },
          { id: 'break', name: 'Break/Personal', color: '#EF4444' },
        ];

        setProjects([...jobProjects, ...commonProjects]);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load jobs',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    }
  };

  // Load today's time entries
  const loadTodaysEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/time-tracking?technician_name=${encodeURIComponent(TECHNICIAN_NAME)}&start_date=${today}&end_date=${today}`
      );
      const data = await response.json();

      if (response.ok) {
        // Convert DB entries to our format
        const convertedEntries: TimeEntry[] = data.entries.map(
          (entry: DBTimeEntry) => ({
            id: entry.id,
            job_id: entry.job_id,
            technician_name: entry.technician_name,
            description: entry.notes || '',
            start_time: new Date(entry.start_time),
            end_time: entry.end_time ? new Date(entry.end_time) : null,
            duration: entry.total_hours
              ? Math.floor(entry.total_hours * 3600)
              : 0,
            status: entry.status,
            hourly_rate: entry.hourly_rate,
          })
        );

        setTimeEntries(convertedEntries);
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  // Check for active time entry
  const checkForActiveEntry = async () => {
    try {
      const response = await fetch(
        `/api/time-tracking?action=active_entry&technician_name=${encodeURIComponent(TECHNICIAN_NAME)}`
      );
      const data = await response.json();

      if (response.ok && data.active_entry) {
        const entry = data.active_entry;
        setCurrentEntry({
          id: entry.id,
          job_id: entry.job_id,
          technician_name: entry.technician_name,
          description: entry.notes || '',
          start_time: new Date(entry.start_time),
          end_time: null,
          duration: 0,
          status: entry.status,
          hourly_rate: entry.hourly_rate,
        });
        setSelectedJobId(entry.job_id || '');
        setDescription(entry.notes || '');
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error checking for active entry:', error);
    }
  };

  // Format duration to HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/stop timer
  const handleTimerToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (!isRunning) {
        // Clock In
        const clockInData = {
          technician_name: TECHNICIAN_NAME,
          job_id: selectedJobId || undefined,
          notes: description,
        };

        const response = await fetch('/api/time-tracking?action=clock_in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clockInData),
        });

        const result = await response.json();

        if (response.ok) {
          setCurrentEntry({
            id: result.id,
            job_id: result.job_id,
            technician_name: result.technician_name,
            description: result.notes || '',
            start_time: new Date(result.start_time),
            end_time: null,
            duration: 0,
            status: result.status,
            hourly_rate: result.hourly_rate,
          });
          setIsRunning(true);

          toast({
            title: 'Clocked In',
            description: 'Timer started successfully',
          });
        } else {
          throw new Error(result.error || 'Failed to clock in');
        }
      } else {
        // Clock Out
        if (!currentEntry) {
          throw new Error('No active time entry');
        }

        const clockOutData = {
          time_entry_id: currentEntry.id,
          notes: description,
        };

        const response = await fetch('/api/time-tracking?action=clock_out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clockOutData),
        });

        const result = await response.json();

        if (response.ok) {
          const completedEntry: TimeEntry = {
            ...currentEntry,
            end_time: new Date(result.end_time),
            duration: Math.floor((result.total_hours || 0) * 3600),
            status: result.status,
          };

          setTimeEntries((prev) => [
            completedEntry,
            ...prev.filter((e) => e.id !== completedEntry.id),
          ]);
          setCurrentEntry(null);
          setIsRunning(false);

          toast({
            title: 'Clocked Out',
            description: `Worked for ${formatDuration(completedEntry.duration)}`,
          });
        } else {
          throw new Error(result.error || 'Failed to clock out');
        }
      }
    } catch (error: any) {
      console.error('Timer toggle error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle timer',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Add manual time entry
  const handleManualEntry = async (data: {
    projectId: string;
    description: string;
    startTime: string;
    endTime: string;
    date: string;
  }) => {
    try {
      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      const endDateTime = new Date(`${data.date}T${data.endTime}`);

      if (endDateTime <= startDateTime) {
        toast({
          title: 'Invalid Time',
          description: 'End time must be after start time',
          variant: 'destructive',
        });
        return;
      }

      // Clock in first
      const clockInResponse = await fetch(
        '/api/time-tracking?action=clock_in',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technician_name: TECHNICIAN_NAME,
            job_id:
              data.projectId === 'admin' ||
              data.projectId === 'travel' ||
              data.projectId === 'break'
                ? undefined
                : data.projectId,
            notes: data.description,
            // Override start time in the backend if needed
          }),
        }
      );

      if (!clockInResponse.ok) {
        throw new Error('Failed to create time entry');
      }

      const clockInResult = await clockInResponse.json();

      // Immediately clock out with the specified end time
      const clockOutResponse = await fetch(
        '/api/time-tracking?action=clock_out',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time_entry_id: clockInResult.id,
            notes: data.description,
            // Override end time in the backend if needed
          }),
        }
      );

      if (!clockOutResponse.ok) {
        throw new Error('Failed to complete time entry');
      }

      const clockOutResult = await clockOutResponse.json();

      const newEntry: TimeEntry = {
        id: clockOutResult.id,
        job_id: clockOutResult.job_id,
        technician_name: clockOutResult.technician_name,
        description: clockOutResult.notes || '',
        start_time: startDateTime,
        end_time: endDateTime,
        duration: Math.floor(
          (endDateTime.getTime() - startDateTime.getTime()) / 1000
        ),
        status: clockOutResult.status,
        hourly_rate: clockOutResult.hourly_rate,
      };

      setTimeEntries((prev) => [newEntry, ...prev]);
      setShowManualEntry(false);

      toast({
        title: 'Entry Added',
        description: `Added ${formatDuration(newEntry.duration)} time entry`,
      });
    } catch (error: any) {
      console.error('Manual entry error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add manual entry',
        variant: 'destructive',
      });
    }
  };

  // Delete time entry (Note: This may not be possible with your current API)
  const handleDeleteEntry = async (id: string) => {
    // For now, just remove from UI since there's no delete endpoint
    setTimeEntries((prev) => prev.filter((entry) => entry.id !== id));

    toast({
      title: 'Entry Removed',
      description: 'Time entry removed from view',
    });
  };

  // Get project by ID
  const getProject = (id: string | null) => {
    return projects.find((p) => p.id === id);
  };

  // Calculate today's total
  const getTodayTotal = () => {
    try {
      const totalSeconds = timeEntries.reduce(
        (sum, entry) => sum + (entry.duration || 0),
        0
      );
      const currentSeconds = currentEntry?.duration || 0;
      return formatDuration(totalSeconds + currentSeconds);
    } catch (error) {
      console.error('Error calculating total:', error);
      return '00:00:00';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Time Tracker</h1>
        <div className="text-sm text-muted-foreground">
          Today: {getTodayTotal()}
        </div>
      </div>

      {/* Timer Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Timer Display */}
            <div className="text-4xl font-mono font-bold min-w-[200px]">
              {isHydrated
                ? formatDuration(currentEntry?.duration || 0)
                : '00:00:00'}
            </div>

            {/* Project Selection */}
            <div className="flex-1">
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span>{project.name}</span>
                        {project.client && (
                          <span className="text-sm text-muted-foreground">
                            ({project.client})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description Input */}
            <div className="flex-1">
              <Input
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Start/Stop Button */}
            <Button
              onClick={handleTimerToggle}
              disabled={loading}
              size="lg"
              className={
                isRunning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {loading ? (
                'Processing...'
              ) : isRunning ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </>
              )}
            </Button>
          </div>

          {/* Current Timer Status */}
          {isRunning && currentEntry && (
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex items-center gap-2 text-blue-800">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="font-medium">
                  Started at {currentEntry.start_time.toLocaleTimeString()}
                </span>
                {currentEntry.job_id && (
                  <>
                    <span>•</span>
                    <span>{getProject(currentEntry.job_id)?.name}</span>
                  </>
                )}
                {currentEntry.description && (
                  <>
                    <span>•</span>
                    <span className="italic">{currentEntry.description}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Entries List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Time Entries
          </CardTitle>
          <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Time Entry</DialogTitle>
                <DialogDescription>
                  Enter time manually for work done earlier
                </DialogDescription>
              </DialogHeader>
              <ManualEntryForm
                projects={projects}
                onSubmit={handleManualEntry}
                onCancel={() => setShowManualEntry(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeEntries.length === 0 && !currentEntry ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No time entries for today</p>
                <p className="text-sm">Start the timer or add a manual entry</p>
              </div>
            ) : (
              <>
                {/* Current Entry */}
                {currentEntry && (
                  <div className="flex items-center justify-between p-3 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor:
                            getProject(currentEntry.job_id)?.color || '#6B7280',
                        }}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getProject(currentEntry.job_id)?.name ||
                              'No Project'}
                          </span>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                          <span className="text-sm text-blue-600 font-medium">
                            Active
                          </span>
                        </div>
                        {currentEntry.description && (
                          <div className="text-sm text-muted-foreground">
                            {currentEntry.description}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Started at{' '}
                          {currentEntry.start_time.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-medium text-lg text-blue-600">
                        {isHydrated
                          ? formatDuration(currentEntryDuration)
                          : '00:00:00'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Completed Entries */}
                {timeEntries.map((entry) => {
                  const project = getProject(entry.job_id);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* Project Indicator */}
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: project?.color || '#6B7280',
                          }}
                        />

                        {/* Entry Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {project?.name || 'No Project'}
                            </span>
                            {project?.client && (
                              <span className="text-sm text-muted-foreground">
                                • {project.client}
                              </span>
                            )}
                          </div>
                          {entry.description && (
                            <div className="text-sm text-muted-foreground">
                              {entry.description}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {entry.start_time.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {entry.end_time && (
                              <>
                                {' - '}
                                {entry.end_time.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Duration and Actions */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-mono font-medium">
                            {formatDuration(entry.duration)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Manual Entry Form Component
interface ManualEntryFormProps {
  projects: Project[];
  onSubmit: (data: {
    projectId: string;
    description: string;
    startTime: string;
    endTime: string;
    date: string;
  }) => void;
  onCancel: () => void;
}

function ManualEntryForm({
  projects,
  onSubmit,
  onCancel,
}: ManualEntryFormProps) {
  const [formData, setFormData] = useState({
    projectId: '',
    description: '',
    startTime: '',
    endTime: '',
    date: new Date().toISOString().split('T')[0], // Today's date
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.startTime && formData.endTime && formData.projectId) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="manual-date">Date</Label>
        <Input
          id="manual-date"
          type="date"
          value={formData.date}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, date: e.target.value }))
          }
        />
      </div>

      <div>
        <Label htmlFor="manual-project">Project</Label>
        <Select
          value={formData.projectId}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, projectId: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose project..." />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span>{project.name}</span>
                  {project.client && (
                    <span className="text-sm text-muted-foreground">
                      ({project.client})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="manual-description">Description</Label>
        <Textarea
          id="manual-description"
          placeholder="What did you work on?"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="manual-start">Start Time</Label>
          <Input
            id="manual-start"
            type="time"
            value={formData.startTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startTime: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="manual-end">End Time</Label>
          <Input
            id="manual-end"
            type="time"
            value={formData.endTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endTime: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            !formData.projectId || !formData.startTime || !formData.endTime
          }
        >
          Add Entry
        </Button>
      </div>
    </form>
  );
}
