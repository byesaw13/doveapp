'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Square } from 'lucide-react';

type ActiveEntry = {
  id: string;
  start_time: string;
};

interface AdminClockBannerProps {
  technicianName: string;
}

export function AdminClockBanner({ technicianName }: AdminClockBannerProps) {
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null);
  const [loading, setLoading] = useState(false);

  const elapsed = useMemo(() => {
    if (!activeEntry) return '';
    const start = new Date(activeEntry.start_time).getTime();
    const now = Date.now();
    const diffMs = now - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }, [activeEntry, Date.now()]);

  const fetchActiveEntry = async () => {
    try {
      const res = await fetch(
        `/api/time-tracking?action=active_entry&technician_name=${encodeURIComponent(technicianName)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setActiveEntry(data.active_entry || null);
    } catch (err) {
      console.warn('Clock status check failed', err);
    }
  };

  useEffect(() => {
    fetchActiveEntry();
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchActiveEntry();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [technicianName]);

  const clockIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/time-tracking?action=clock_in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technician_name: technicianName }),
      });
      if (res.ok) {
        await fetchActiveEntry();
      }
    } catch (err) {
      console.error('Clock in failed', err);
    } finally {
      setLoading(false);
    }
  };

  const clockOut = async () => {
    if (loading || !activeEntry) return;
    setLoading(true);
    try {
      const res = await fetch('/api/time-tracking?action=clock_out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_entry_id: activeEntry.id,
          notes: 'Auto clock-out from header',
        }),
      });
      if (res.ok) {
        setActiveEntry(null);
      }
    } catch (err) {
      console.error('Clock out failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
      <div className="flex flex-col">
        <span className="font-medium">
          {activeEntry
            ? `On the clock since ${new Date(activeEntry.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
            : 'Off the clock'}
        </span>
        {activeEntry && (
          <span className="text-muted-foreground text-xs">
            Elapsed: {elapsed}
          </span>
        )}
      </div>
      <div className="ml-auto">
        {activeEntry ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={clockOut}
            disabled={loading}
            className="inline-flex items-center gap-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Clock out
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={clockIn}
            disabled={loading}
            className="inline-flex items-center gap-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Clock in
          </Button>
        )}
      </div>
    </div>
  );
}
