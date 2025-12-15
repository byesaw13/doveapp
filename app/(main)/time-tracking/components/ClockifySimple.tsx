'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ClockifySimple() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    // Set hydrated state asynchronously to avoid cascading renders
    const hydrate = () => setIsHydrated(true);
    // Use setTimeout to defer the state update
    const timeoutId = setTimeout(hydrate, 0);

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  const formatTime = (time: Date): string => {
    if (!time) return '00:00:00';
    try {
      return time.toLocaleTimeString();
    } catch {
      return '00:00:00';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Time Tracker</h1>
        <div className="text-sm text-muted-foreground">
          {isHydrated ? formatTime(currentTime) : 'Loading...'}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-mono font-bold min-w-[200px]">
              00:00:00
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              Start Timer
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Status</h3>
        <p>Component loaded successfully!</p>
        <p>
          Current time: {isHydrated ? formatTime(currentTime) : 'Loading...'}
        </p>
      </div>
    </div>
  );
}
