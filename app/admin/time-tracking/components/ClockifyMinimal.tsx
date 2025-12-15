'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ClockifyMinimal() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Set hydrated state asynchronously to avoid cascading renders
    const hydrate = () => setIsHydrated(true);
    // Use setTimeout to defer the state update
    const timeoutId = setTimeout(hydrate, 0);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(timer);
    };
  }, []);

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Time Tracker (Minimal)</h1>
        <div className="text-sm text-muted-foreground">
          Current Time: {isHydrated ? formatTime(currentTime) : '--:--:--'}
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
        <p>Minimal test component is working!</p>
        <p>Time: {isHydrated ? formatTime(currentTime) : 'Loading...'}</p>
      </div>
    </div>
  );
}
