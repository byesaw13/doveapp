'use client';

import { useState, useEffect } from 'react';
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
import { Play, Pause, Clock } from 'lucide-react';
import { JobWithClient } from '@/types/job';

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

export function TimeTracker() {
  // State management
  const [time, setTime] = useState(new Date());
  const [hydrated, setHydrated] = useState(false);
  const [running, setRunning] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();

      if (response.ok) {
        const jobProjects: Project[] = data.jobs.map(
          (job: JobWithClient, index: number) => ({
            id: job.id,
            name: job.title,
            client: `${job.client.first_name} ${job.client.last_name}`,
            color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
          })
        );

        setProjects([
          ...jobProjects,
          { id: 'admin', name: 'Admin Tasks', color: '#6B7280' },
          { id: 'travel', name: 'Travel Time', color: '#F59E0B' },
        ]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadTodaysEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/time-tracking?technician_name=Demo%20Technician&start_date=${today}&end_date=${today}`
      );
      const data = await response.json();

      if (response.ok) {
        setTimeEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  const checkActiveEntry = async () => {
    try {
      const response = await fetch(
        '/api/time-tracking?action=active_entry&technician_name=Demo%20Technician'
      );
      const data = await response.json();

      if (response.ok && data.active_entry) {
        setRunning(true);
        setActiveEntryId(data.active_entry.id);
        setSelectedProject(data.active_entry.job_id || '');
        setDescription(data.active_entry.notes || '');
      }
    } catch (error) {
      console.error('Error checking active entry:', error);
    }
  };

  const toggleTimer = async () => {
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
          console.log('Clocked in successfully');
        } else {
          console.error('Failed to clock in');
        }
      } else {
        // Clock Out - need to get active entry ID first
        const activeResponse = await fetch(
          '/api/time-tracking?action=active_entry&technician_name=Demo%20Technician'
        );
        const activeData = await activeResponse.json();

        if (activeData.active_entry) {
          const response = await fetch('/api/time-tracking?action=clock_out', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              time_entry_id: activeData.active_entry.id,
              notes: description,
            }),
          });

          if (response.ok) {
            setRunning(false);
            console.log('Clocked out successfully');
            // Refresh entries
            loadTodaysEntries();
          } else {
            console.error('Failed to clock out');
          }
        }
      }
    } catch (error) {
      console.error('Timer toggle error:', error);
    }
  };

  const formatTime = (date: Date) => {
    if (!hydrated || !date) return '--:--:--';
    return date.toLocaleTimeString();
  };

  // Initialize component
  useEffect(() => {
    // Set hydrated state asynchronously to avoid cascading renders
    const hydrate = () => setHydrated(true);
    // Use setTimeout to defer the state update
    const timeoutId = setTimeout(hydrate, 0);

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
    loadTodaysEntries();
    checkActiveEntry();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Time Tracker</h1>
        <div className="text-sm text-muted-foreground">Today: 00:00:00</div>
      </div>

      {/* Timer Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Timer Display */}
            <div className="text-4xl font-mono font-bold min-w-[200px]">
              00:00:00
            </div>

            {/* Project Selection */}
            <div className="flex-1">
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
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

            {/* Description Input */}
            <div className="flex-1">
              <Input
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Start/Stop Button */}
            <Button
              onClick={toggleTimer}
              size="lg"
              className={
                running
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {running ? (
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

          {/* Status */}
          {running && (
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex items-center gap-2 text-blue-800">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="font-medium">
                  Timer running since {formatTime(time)}
                </span>
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
            Today's Time Entries
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
    </div>
  );
}
