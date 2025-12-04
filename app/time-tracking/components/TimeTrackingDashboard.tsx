'use client';

import { useState, useEffect } from 'react';

// Helper to generate unique IDs outside of render
const generateSegmentId = (): string =>
  `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
import {
  Clock,
  Play,
  Square,
  RotateCcw,
  MapPin,
  DollarSign,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TimeTrackingDashboardProps {
  technicianName?: string;
}

interface ActivitySegment {
  id: string;
  activity: string;
  jobId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  billable: boolean;
  notes?: string;
}

export function TimeTrackingDashboard({
  technicianName = 'Demo Technician',
}: TimeTrackingDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMainClockRunning, setIsMainClockRunning] = useState(false);
  const [mainClockStartTime, setMainClockStartTime] = useState<Date | null>(
    null
  );
  const [currentActivity, setCurrentActivity] = useState<string>('work');
  const [currentActivityStart, setCurrentActivityStart] = useState<Date | null>(
    null
  );
  const [activitySegments, setActivitySegments] = useState<ActivitySegment[]>(
    []
  );
  const [selectedJobId, setSelectedJobId] = useState<string>('none');
  const [activityNotes, setActivityNotes] = useState('');
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock jobs for demonstration
  const mockJobs = [
    {
      id: 'job-1',
      title: 'Kitchen Renovation - Smith Residence',
      client: 'John Smith',
    },
    {
      id: 'job-2',
      title: 'Bathroom Remodel - Johnson Home',
      client: 'Sarah Johnson',
    },
    {
      id: 'job-3',
      title: 'Deck Construction - Davis Property',
      client: 'Mike Davis',
    },
  ];

  // Activity types for time tracking
  const activityTypes = [
    {
      value: 'work',
      label: 'Working on Job',
      icon: '🔧',
      billable: true,
      color: 'bg-blue-500',
    },
    {
      value: 'driving',
      label: 'Driving/Travel',
      icon: '🚗',
      billable: true,
      color: 'bg-green-500',
    },
    {
      value: 'shopping',
      label: 'Shopping/Supplies',
      icon: '🛒',
      billable: true,
      color: 'bg-purple-500',
    },
    {
      value: 'admin',
      label: 'Admin/Planning',
      icon: '📋',
      billable: false,
      color: 'bg-gray-500',
    },
    {
      value: 'training',
      label: 'Training/Learning',
      icon: '📚',
      billable: false,
      color: 'bg-indigo-500',
    },
    {
      value: 'break',
      label: 'Break/Personal',
      icon: '☕',
      billable: false,
      color: 'bg-orange-500',
    },
  ];

  // Handle hydration and update current time every second
  useEffect(() => {
    // Set hydration flag after mount
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate elapsed time for main clock
  const getMainClockElapsed = () => {
    if (!mainClockStartTime) return '00:00:00';

    const diff = currentTime.getTime() - mainClockStartTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate elapsed time for current activity
  const getCurrentActivityElapsed = () => {
    if (!currentActivityStart) return '00:00:00';

    const diff = currentTime.getTime() - currentActivityStart.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Main clock in/out
  const handleMainClockToggle = async () => {
    setLoading(true);

    if (!isMainClockRunning) {
      // Clock In
      const now = new Date();
      setMainClockStartTime(now);
      setCurrentActivityStart(now);
      setIsMainClockRunning(true);

      // Start first activity segment
      const newSegment: ActivitySegment = {
        id: generateSegmentId(),
        activity: currentActivity,
        jobId: selectedJobId !== 'none' ? selectedJobId : undefined,
        startTime: now,
        duration: 0,
        billable:
          activityTypes.find((a) => a.value === currentActivity)?.billable ||
          false,
        notes: activityNotes,
      };
      setActivitySegments([newSegment]);
    } else {
      // Clock Out
      const now = new Date();

      // End current activity segment
      setActivitySegments((prev) =>
        prev.map((segment) =>
          !segment.endTime
            ? {
                ...segment,
                endTime: now,
                duration: Math.round(
                  (now.getTime() - segment.startTime.getTime()) / (1000 * 60)
                ),
              }
            : segment
        )
      );

      setMainClockStartTime(null);
      setCurrentActivityStart(null);
      setIsMainClockRunning(false);
    }

    setLoading(false);
  };

  // Switch activity
  const handleActivitySwitch = (
    newActivity: string,
    jobId?: string,
    notes?: string
  ) => {
    if (!isMainClockRunning) return;

    const now = new Date();

    // End current activity segment
    setActivitySegments((prev) =>
      prev.map((segment) =>
        !segment.endTime
          ? {
              ...segment,
              endTime: now,
              duration: Math.round(
                (now.getTime() - segment.startTime.getTime()) / (1000 * 60)
              ),
            }
          : segment
      )
    );

    // Start new activity segment
    const newSegment: ActivitySegment = {
      id: generateSegmentId(),
      activity: newActivity,
      jobId: jobId !== 'none' ? jobId : undefined,
      startTime: now,
      duration: 0,
      billable:
        activityTypes.find((a) => a.value === newActivity)?.billable || false,
      notes: notes,
    };

    setActivitySegments((prev) => [...prev, newSegment]);
    setCurrentActivity(newActivity);
    setCurrentActivityStart(now);
    setSelectedJobId(jobId || 'none');
    setActivityNotes(notes || '');
    setShowActivityDialog(false);
  };

  // Get current activity info
  const getCurrentActivityInfo = () => {
    return activityTypes.find((a) => a.value === currentActivity);
  };

  // Calculate totals
  const getTotals = () => {
    const totalMinutes = activitySegments.reduce(
      (sum, segment) => sum + segment.duration,
      0
    );
    const billableMinutes = activitySegments
      .filter((segment) => segment.billable)
      .reduce((sum, segment) => sum + segment.duration, 0);

    return {
      totalHours: (totalMinutes / 60).toFixed(2),
      billableHours: (billableMinutes / 60).toFixed(2),
      totalEarnings: ((billableMinutes / 60) * 45).toFixed(2), // $45/hour
    };
  };

  const totals = getTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Tracking</h2>
          <p className="text-muted-foreground">
            {technicianName} - Track your workday and activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Current Time</div>
            <div className="text-lg font-mono">
              {isHydrated ? currentTime.toLocaleTimeString() : '--:--:-- --'}
            </div>
          </div>
          <Badge
            variant={isMainClockRunning ? 'default' : 'outline'}
            className={isMainClockRunning ? 'bg-green-100 text-green-800' : ''}
          >
            {isMainClockRunning ? 'Clocked In' : 'Clocked Out'}
          </Badge>
        </div>
      </div>

      {/* Main Time Clock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Main Time Clock
          </CardTitle>
          <CardDescription>Your primary work clock for the day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            {/* Main Clock Timer */}
            <div className="text-6xl font-mono font-bold text-primary">
              {isHydrated ? getMainClockElapsed() : '00:00:00'}
            </div>

            {/* Clock Status */}
            <div className="space-y-2">
              {isMainClockRunning && (
                <div className="text-sm text-muted-foreground">
                  Started at {mainClockStartTime?.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Main Clock Button */}
            <Button
              size="lg"
              onClick={handleMainClockToggle}
              disabled={loading}
              className={
                isMainClockRunning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {loading ? (
                'Processing...'
              ) : isMainClockRunning ? (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  Clock Out
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Clock In
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Activity & Switcher */}
      {isMainClockRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Current Activity
            </CardTitle>
            <CardDescription>
              What are you working on right now?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Activity Display */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {getCurrentActivityInfo()?.icon}
                  </div>
                  <div>
                    <div className="font-medium">
                      {getCurrentActivityInfo()?.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedJobId !== 'none'
                        ? mockJobs.find((j) => j.id === selectedJobId)?.title
                        : 'No specific job'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold">
                    {isHydrated ? getCurrentActivityElapsed() : '00:00:00'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Current activity time
                  </div>
                </div>
              </div>

              {/* Activity Switch Button */}
              <Dialog
                open={showActivityDialog}
                onOpenChange={setShowActivityDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Switch Activity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Switch Activity</DialogTitle>
                    <DialogDescription>
                      What are you doing now? This will end your current
                      activity and start a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-activity">New Activity</Label>
                      <Select
                        value={currentActivity}
                        onValueChange={setCurrentActivity}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity" />
                        </SelectTrigger>
                        <SelectContent>
                          {activityTypes.map((activity) => (
                            <SelectItem
                              key={activity.value}
                              value={activity.value}
                            >
                              <span className="flex items-center gap-2">
                                <span>{activity.icon}</span>
                                <span>{activity.label}</span>
                                {activity.billable && (
                                  <Badge variant="outline" className="text-xs">
                                    Billable
                                  </Badge>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="job">Job (Optional)</Label>
                      <Select
                        value={selectedJobId}
                        onValueChange={setSelectedJobId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a job..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific job</SelectItem>
                          {mockJobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="activity-notes">Notes (Optional)</Label>
                      <Input
                        id="activity-notes"
                        placeholder="What are you working on?"
                        value={activityNotes}
                        onChange={(e) => setActivityNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowActivityDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() =>
                          handleActivitySwitch(
                            currentActivity,
                            selectedJobId,
                            activityNotes
                          )
                        }
                      >
                        Switch Activity
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              {isMainClockRunning ? 'Currently working' : 'Work completed'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Billable Hours
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.billableHours}h</div>
            <p className="text-xs text-muted-foreground">
              Hours that can be billed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.totalEarnings}</div>
            <p className="text-xs text-muted-foreground">At $45/hour rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activities</CardTitle>
          <CardDescription>
            Track multiple activities throughout your day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activitySegments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activities tracked today yet</p>
                <p className="text-sm">
                  Clock in to start tracking your workday
                </p>
              </div>
            ) : (
              activitySegments.map((segment) => {
                const activityInfo = activityTypes.find(
                  (a) => a.value === segment.activity
                );
                return (
                  <div
                    key={segment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{activityInfo?.icon}</div>
                      <div>
                        <div className="font-medium">{activityInfo?.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {segment.startTime.toLocaleTimeString()} -
                          {segment.endTime
                            ? segment.endTime.toLocaleTimeString()
                            : 'Ongoing'}
                          {segment.jobId && (
                            <span className="ml-2">
                              •{' '}
                              {
                                mockJobs.find((j) => j.id === segment.jobId)
                                  ?.title
                              }
                            </span>
                          )}
                        </div>
                        {segment.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {segment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-medium">
                          {segment.endTime
                            ? `${Math.floor(segment.duration / 60)}h ${segment.duration % 60}m`
                            : isHydrated
                              ? getCurrentActivityElapsed()
                              : '00:00:00'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {segment.duration} min
                        </div>
                      </div>
                      {segment.billable && (
                        <Badge variant="outline" className="text-xs">
                          Billable
                        </Badge>
                      )}
                      <Badge
                        variant={segment.endTime ? 'default' : 'secondary'}
                      >
                        {segment.endTime ? 'Completed' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {isMainClockRunning && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="font-medium">Currently tracking:</span>
                <span>
                  {
                    activityTypes.find((a) => a.value === currentActivity)
                      ?.label
                  }
                </span>
                {selectedJobId !== 'none' && (
                  <span className="text-sm">
                    on {mockJobs.find((j) => j.id === selectedJobId)?.title}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
