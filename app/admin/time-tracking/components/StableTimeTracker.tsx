'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Pause, Clock, Coffee, Bell } from 'lucide-react';

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
  const [selectedProject, setSelectedProject] = useState('none');
  const [description, setDescription] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onBreak, setOnBreak] = useState(false);
  const [currentBreakId, setCurrentBreakId] = useState<string | null>(null);
  const [punchSound, setPunchSound] = useState(false);

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

  // Restore active timer state when the component mounts or tab becomes visible
  useEffect(() => {
    if (!hydrated) return;

    const fetchActiveState = async () => {
      try {
        const entryRes = await fetch(
          '/api/time-tracking?action=active_entry&technician_name=Demo%20Technician'
        );
        if (entryRes.ok) {
          const entryData = await entryRes.json();
          const activeEntry = entryData.active_entry;
          if (activeEntry) {
            setRunning(true);
            setStartTime(new Date(activeEntry.start_time));

            // Check for active break tied to this entry
            const breakRes = await fetch(
              `/api/time-tracking?action=active_break&time_entry_id=${activeEntry.id}`
            );
            if (breakRes.ok) {
              const breakData = await breakRes.json();
              if (breakData.active_break) {
                setOnBreak(true);
                setCurrentBreakId(breakData.active_break.id);
              } else {
                setOnBreak(false);
                setCurrentBreakId(null);
              }
            }
          } else {
            setRunning(false);
            setStartTime(null);
            setOnBreak(false);
            setCurrentBreakId(null);
          }
        }
      } catch (err) {
        console.warn('Failed to restore active timer state:', err);
      }
    };

    fetchActiveState();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchActiveState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [hydrated]);

  // Punch sound effect
  useEffect(() => {
    if (punchSound) {
      // Simple beep sound using Web Audio API
      try {
        const audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(
          600,
          audioContext.currentTime + 0.1
        );

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);

        setTimeout(() => setPunchSound(false), 300);
      } catch (err) {
        // Fallback - no sound
        setTimeout(() => setPunchSound(false), 300);
      }
    }
  }, [punchSound]);

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
            job_id: selectedProject === 'none' ? undefined : selectedProject,
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
        // Clock Out - First get active time entry
        const activeEntryResponse = await fetch(
          '/api/time-tracking?action=active_entry&technician_name=Demo%20Technician'
        );
        if (!activeEntryResponse.ok) {
          throw new Error('Failed to get active time entry');
        }

        const activeEntryData = await activeEntryResponse.json();
        if (!activeEntryData.active_entry) {
          throw new Error('No active time entry found');
        }

        const response = await fetch('/api/time-tracking?action=clock_out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time_entry_id: activeEntryData.active_entry.id,
            notes: description,
          }),
        });

        if (response.ok) {
          setRunning(false);
          setStartTime(null);
          toast({
            title: 'Timer Stopped',
            description: 'You have successfully clocked out.',
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Failed to toggle timer:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to toggle timer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBreak = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (!onBreak) {
        // Start Break - First get active time entry
        const activeEntryResponse = await fetch(
          '/api/time-tracking?action=active_entry&technician_name=Demo%20Technician'
        );
        if (!activeEntryResponse.ok) {
          throw new Error('No active time entry found. Please clock in first.');
        }

        const activeEntryData = await activeEntryResponse.json();
        if (!activeEntryData.active_entry) {
          throw new Error('No active time entry found. Please clock in first.');
        }

        const response = await fetch('/api/time-tracking?action=start_break', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time_entry_id: activeEntryData.active_entry.id,
            break_type: 'break',
          }),
        });

        if (response.ok) {
          setOnBreak(true);
          toast({
            title: 'Break Started',
            description: 'You are now on break.',
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      } else {
        // End Break - First get active time entry and break
        const activeEntryResponse = await fetch(
          '/api/time-tracking?action=active_entry&technician_name=Demo%20Technician'
        );
        if (!activeEntryResponse.ok) {
          throw new Error('Failed to get active time entry');
        }

        const activeEntryData = await activeEntryResponse.json();
        if (!activeEntryData.active_entry) {
          throw new Error('No active time entry found');
        }

        const activeBreakResponse = await fetch(
          `/api/time-tracking?action=active_break&time_entry_id=${activeEntryData.active_entry.id}`
        );
        if (!activeBreakResponse.ok) {
          throw new Error('Failed to get active break');
        }

        const activeBreakData = await activeBreakResponse.json();
        if (!activeBreakData.active_break) {
          throw new Error('No active break found');
        }

        const response = await fetch('/api/time-tracking?action=end_break', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            break_id: activeBreakData.active_break.id,
          }),
        });

        if (response.ok) {
          setOnBreak(false);
          toast({
            title: 'Break Ended',
            description: 'You are back to work.',
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Failed to toggle break:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to toggle break.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatElapsedTime = () => {
    if (!startTime) return '--:--:--';

    const elapsed = Math.floor((time.getTime() - startTime.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const elapsedTime = useMemo(
    () => formatElapsedTime(),
    [time, startTime, hydrated]
  );

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([loadProjectsSafely(), loadTimeEntriesSafely()]);
        setDataLoaded(true);
      } catch (err) {
        console.warn('Failed to load initial data:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, []);

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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[600px] p-6">
      {/* Old School Punch Clock */}
      <div className="relative">
        {/* Punch Clock Body */}
        <div className="bg-gradient-to-b from-gray-700 via-gray-600 to-gray-800 rounded-3xl shadow-2xl border-8 border-gray-900 p-8 w-96 h-[500px] relative overflow-hidden">
          {/* Metallic shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 rounded-3xl"></div>

          {/* Clock Face */}
          <div className="relative z-10 text-center mb-8">
            <div className="bg-gradient-to-b from-gray-100 to-gray-300 rounded-full w-32 h-32 mx-auto shadow-inner border-4 border-gray-400 flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-800 font-mono">
                {time.toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className="text-xs text-gray-300 mt-2 font-mono">
              {time.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* Status Display */}
          <div className="relative z-10 bg-black rounded-lg p-3 mb-6 text-center border-2 border-gray-500">
            <div className="text-green-400 font-mono text-sm">
              {running ? (
                <>
                  <div className="text-red-400 animate-pulse">● CLOCKED IN</div>
                  <div className="text-yellow-400 mt-1">
                    {startTime && formatElapsedTime()}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Since{' '}
                    {startTime?.toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </>
              ) : (
                <div className="text-gray-400">● CLOCKED OUT</div>
              )}
            </div>
          </div>

          {/* Punch Buttons */}
          <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={toggleTimer}
              disabled={loading}
              className={`h-16 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-200 ${
                running
                  ? 'bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border-2 border-red-900 text-white hover:scale-105 active:scale-95'
                  : 'bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 border-2 border-green-900 text-white hover:scale-105 active:scale-95'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClickCapture={() => !loading && setPunchSound(true)}
            >
              <div className="flex flex-col items-center">
                <div className="text-xs opacity-80">CLOCK</div>
                <div className="text-sm font-bold">
                  {running ? 'OUT' : 'IN'}
                </div>
              </div>
            </button>

            <button
              onClick={toggleBreak}
              disabled={loading || !running}
              className={`h-16 rounded-xl font-bold text-sm shadow-lg transform transition-all duration-200 ${
                onBreak
                  ? 'bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 border-2 border-blue-900 text-white'
                  : 'bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 border-2 border-amber-900 text-white'
              } ${loading || !running ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            >
              <div className="flex flex-col items-center">
                <Coffee className="w-4 h-4 mb-1" />
                <div>{onBreak ? 'END' : 'BREAK'}</div>
              </div>
            </button>
          </div>

          {/* Project Selection */}
          <div className="relative z-10 mb-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="bg-gray-100 border-2 border-gray-400 text-gray-800 font-medium">
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                    {project.client && ` - ${project.client}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description Input */}
          <div className="relative z-10">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="bg-gray-100 border-2 border-gray-400 text-gray-800 placeholder-gray-500"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="relative z-10 mt-4 p-2 bg-red-900 border border-red-700 rounded text-red-200 text-xs text-center">
              {error}
            </div>
          )}

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-yellow-900" />
          </div>

          <div className="absolute top-4 right-4 w-6 h-6 bg-gradient-to-br from-silver-400 to-gray-500 rounded-full shadow-inner"></div>

          {/* Time Card Slot */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-gradient-to-b from-gray-800 to-black rounded-t-lg border-2 border-gray-600 shadow-inner">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent mt-2"></div>
            <div className="text-xs text-gray-400 text-center mt-1 font-mono">
              TIME CARD
            </div>
          </div>
        </div>

        {/* Recent Entries - Small display below clock */}
        <div className="mt-6 bg-white rounded-lg shadow-lg border border-gray-300 p-4 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 text-center">
            Recent Entries
          </h3>
          {timeEntries.length === 0 ? (
            <p className="text-gray-500 text-center text-sm py-2">
              No time entries yet
            </p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {timeEntries.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {entry.technician_name}
                    </div>
                    <div className="text-gray-600">
                      {entry.start_time
                        ? new Date(entry.start_time).toLocaleDateString()
                        : 'Unknown'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">
                      {entry.total_hours
                        ? `${entry.total_hours.toFixed(1)}h`
                        : 'Active'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const loadProjectsSafely = async () => {
    try {
      const response = await fetch('/api/time-tracking?action=projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.warn('Failed to load projects:', err);
    }
  };

  const loadTimeEntriesSafely = async () => {
    try {
      const response = await fetch(
        '/api/time-tracking?action=entries&technician_name=Demo%20Technician'
      );
      if (response.ok) {
        const data = await response.json();
        setTimeEntries(data.entries || []);
      }
    } catch (err) {
      console.warn('Failed to load time entries:', err);
    }
  };
}
