'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
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
import { Play, Pause, Clock, Coffee } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  client?: string;
  color: string;
}

interface TimeEntry {
  id: string;
  technician_name: string;
  job_id?: string;
  start_time: string;
  end_time?: string;
  total_hours?: number;
  notes?: string;
}

export function StableTimeTracker() {
  const { toast } = useToast();

  // Basic state
  const [time, setTime] = useState(new Date());
  const [hydrated, setHydrated] = useState(false);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onBreak, setOnBreak] = useState(false);
  const [currentBreakId, setCurrentBreakId] = useState<string | null>(null);

  // Initialize component safely
  useEffect(() => {
    try {
      setHydrated(true);
      const interval = setInterval(() => {
        setTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    } catch (err) {
      console.warn('Failed to check active entry:', err);
      setError(
        'Failed to check for active timer. Please refresh if you were timing.'
      );
    }
  }, []);

  const toggleTimer = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (!running) {
        // Clock In
        const response = await fetch('/api/time-tracking?action=clock_in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technician_name: 'Demo Technician',
            job_id: selectedProject || undefined,
            notes: description,
          }),
        });

        if (response.ok) {
          setRunning(true);
          setStartTime(new Date());
          toast({
            title: 'Timer Started',
            description: 'You have successfully clocked in.',
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      } else {
        // Clock Out
        const activeResponse = await fetch(
          '/api/time-tracking?action=active_entry&technician_name=Demo%20Technician'
        );

        if (activeResponse.ok) {
          const activeData = await activeResponse.json();

          if (activeData?.active_entry?.id) {
            const response = await fetch(
              '/api/time-tracking?action=clock_out',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  time_entry_id: activeData.active_entry.id,
                  notes: description,
                }),
              }
            );

            if (response.ok) {
              setRunning(false);
              setStartTime(null);
              toast({
                title: 'Timer Stopped',
                description: 'Your time entry has been submitted for approval.',
              });
              await loadEntriesSafely(); // Refresh entries
            } else {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `HTTP ${response.status}`);
            }
          } else {
            throw new Error('No active entry found');
          }
        } else {
          throw new Error('Failed to get active entry');
        }
      }
    } catch (err: any) {
      console.error('Timer toggle error:', err);
      setError(err.message || 'Timer operation failed');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectsSafely = async () => {
    try {
      const response = await fetch('/api/jobs');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.jobs && Array.isArray(data.jobs)) {
        const jobProjects: Project[] = data.jobs.map(
          (job: any, index: number) => ({
            id: job.id || `job-${index}`,
            name: job.title || `Job ${index + 1}`,
            client: job.client
              ? `${job.client.first_name || ''} ${job.client.last_name || ''}`.trim()
              : undefined,
            color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
          })
        );

        setProjects([
          ...jobProjects,
          { id: 'admin', name: 'Admin Tasks', color: '#6B7280' },
          { id: 'travel', name: 'Travel Time', color: '#F59E0B' },
        ]);
      } else {
        // Fallback projects
        setProjects([
          { id: 'admin', name: 'Admin Tasks', color: '#6B7280' },
          { id: 'travel', name: 'Travel Time', color: '#F59E0B' },
        ]);
      }
    } catch (err) {
      console.warn('Failed to load projects, using fallback:', err);
      setError('Failed to load projects. Using default options.');
      setProjects([
        { id: 'admin', name: 'Admin Tasks', color: '#6B7280' },
        { id: 'travel', name: 'Travel Time', color: '#F59E0B' },
      ]);
    }
  };

  const loadEntriesSafely = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/time-tracking?technician_name=Demo%20Technician&start_date=${today}&end_date=${today}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.entries && Array.isArray(data.entries)) {
          setTimeEntries(data.entries);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.warn('Failed to load time entries:', err);
      setError('Failed to load time entries. Some features may not work.');
      setTimeEntries([]);
    }
  };

  const checkActiveSafely = async () => {
    try {
      const response = await fetch(
        '/api/time-tracking?action=active_entry&technician_name=Demo%20Technician'
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.active_entry) {
          setRunning(true);
          setStartTime(new Date(data.active_entry.start_time));
          setSelectedProject(data.active_entry.job_id || '');
          setDescription(data.active_entry.notes || '');

          // Check for active break
          try {
            const breakResponse = await fetch(
              `/api/time-tracking?action=active_break&time_entry_id=${data.active_entry.id}`
            );

            if (breakResponse.ok) {
              const breakData = await breakResponse.json();
              if (breakData?.active_break) {
                setOnBreak(true);
                setCurrentBreakId(breakData.active_break.id);
              }
            }
          } catch (breakErr) {
            console.warn('Failed to check active break:', breakErr);
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.warn('Failed to check active entry:', err);
      setError(
        'Failed to check for active timer. Please refresh if you were timing.'
      );
    }
  };

  const toggleBreak = async () => {
    if (loading || !running) return;

    setLoading(true);
    setError(null);

    try {
      if (!onBreak) {
        // Start break
        const activeResponse = await fetch(
          '/api/time-tracking?action=active_entry&technician_name=Demo%20Technician'
        );

        if (activeResponse.ok) {
          const activeData = await activeResponse.json();

          if (activeData?.active_entry?.id) {
            const response = await fetch(
              '/api/time-tracking?action=start_break',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  time_entry_id: activeData.active_entry.id,
                  break_type: 'lunch',
                  notes: 'Break started',
                }),
              }
            );

            if (response.ok) {
              const breakData = await response.json();
              setOnBreak(true);
              setCurrentBreakId(breakData.id);
              toast({
                title: 'Break Started',
                description: 'You are now on break.',
              });
            } else {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `HTTP ${response.status}`);
            }
          } else {
            throw new Error('No active time entry found');
          }
        } else {
          throw new Error('Failed to get active entry');
        }
      } else {
        // End break
        if (currentBreakId) {
          const response = await fetch('/api/time-tracking?action=end_break', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              break_id: currentBreakId,
            }),
          });

          if (response.ok) {
            setOnBreak(false);
            setCurrentBreakId(null);
            toast({
              title: 'Break Ended',
              description: 'You are back to work.',
            });
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }
        }
      }
    } catch (err: any) {
      console.error('Break toggle error:', err);
      setError(err.message || 'Break operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data safely
  useEffect(() => {
    if (hydrated && !dataLoaded) {
      setInitialLoading(true);
      // Load data and ensure loading state is cleared
      const loadData = async () => {
        try {
          await Promise.allSettled([
            loadProjectsSafely(),
            loadEntriesSafely(),
            checkActiveSafely(),
          ]);
        } finally {
          setInitialLoading(false);
          setDataLoaded(true);
        }
      };

      loadData();
    }
  }, [hydrated, dataLoaded]);

  const elapsedTime = useMemo(() => {
    if (!hydrated || !running || !startTime) return '00:00:00';
    try {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return '00:00:00';
    }
  }, [hydrated, running, startTime, time]); // Include time to update every second

  const currentTime = useMemo(() => {
    if (!hydrated) return '--:--:--';
    try {
      return time.toLocaleTimeString();
    } catch {
      return '--:--:--';
    }
  }, [hydrated, time]);

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>

        {/* Timer Section Skeleton */}
        <div className="border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>

        {/* Time Entries Skeleton */}
        <div className="border rounded-xl p-6 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold">Time Tracker</h1>
        <div className="text-sm text-muted-foreground">{currentTime}</div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border border-red-200 rounded-lg p-3 bg-red-50">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-1 text-red-600 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Timer Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Timer Display */}
            <div className="text-4xl font-mono font-bold w-full lg:min-w-[200px] lg:w-auto text-center lg:text-left">
              {elapsedTime}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
              {/* Project Selection */}
              <div className="flex-1">
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                  disabled={loading}
                >
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
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Start/Stop Button */}
              <Button
                onClick={toggleTimer}
                disabled={loading}
                size="lg"
                className={`w-full sm:w-auto ${
                  running
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? (
                  'Processing...'
                ) : running ? (
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

              {/* Break Button */}
              {running && (
                <Button
                  onClick={toggleBreak}
                  disabled={loading}
                  size="lg"
                  variant="outline"
                  className={`w-full sm:w-auto ${
                    onBreak
                      ? 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200'
                      : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {loading ? (
                    'Processing...'
                  ) : onBreak ? (
                    <>
                      <Coffee className="w-5 h-5 mr-2" />
                      End Break
                    </>
                  ) : (
                    <>
                      <Coffee className="w-5 h-5 mr-2" />
                      Start Break
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Status */}
          {running && (
            <div
              className={`mt-4 p-3 border-l-4 rounded ${
                onBreak
                  ? 'bg-orange-50 border-orange-400'
                  : 'bg-blue-50 border-blue-400'
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  onBreak ? 'text-orange-800' : 'text-blue-800'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    onBreak ? 'bg-orange-600' : 'bg-blue-600'
                  }`}
                />
                <span className="font-medium">
                  {onBreak ? 'On Break' : 'Timer running'} - {currentTime}
                </span>
                {selectedProject && (
                  <span>
                    • {projects.find((p) => p.id === selectedProject)?.name}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Time Entries ({timeEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No time entries for today</p>
              <p className="text-sm">Start the timer to begin tracking</p>
            </div>
          ) : (
            <div className="space-y-2">
              {timeEntries.map((entry) => {
                const project = projects.find((p) => p.id === entry.job_id);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project?.color || '#6B7280' }}
                      />
                      <div>
                        <div className="font-medium">
                          {project?.name || 'No Project'}
                        </div>
                        {entry.notes && (
                          <div className="text-sm text-muted-foreground">
                            {entry.notes}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.start_time).toLocaleTimeString()}
                          {entry.end_time && (
                            <>
                              {' '}
                              - {new Date(entry.end_time).toLocaleTimeString()}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium">
                        {entry.total_hours
                          ? `${entry.total_hours.toFixed(2)}h`
                          : 'Active'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Info */}
      <div className="text-xs text-gray-500 text-center">
        Status: {hydrated ? 'Ready' : 'Loading'} • Projects: {projects.length} •
        Entries: {timeEntries.length}
      </div>
    </div>
  );
}
