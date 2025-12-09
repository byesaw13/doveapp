'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import type {
  AutomationHistoryRecord,
  AutomationRecord,
} from '@/types/automation';
import { Loader2, Play, RefreshCw } from 'lucide-react';

interface AutomationWithHistory extends AutomationRecord {
  automation_history?: AutomationHistoryRecord[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
};

const typeLabels: Record<string, string> = {
  estimate_followup: 'Estimate Follow-up',
  invoice_followup: 'Invoice Follow-up',
  job_closeout: 'Job Closeout',
  review_request: 'Review Request',
  lead_response: 'Lead Response',
};

export default function AutomationsDashboard() {
  const { toast } = useToast();
  const [automations, setAutomations] = useState<AutomationWithHistory[]>([]);
  const [filter, setFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadAutomations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/automations?status=${filter}`);
      if (!response.ok) throw new Error('Failed to load automations');
      const data = await response.json();
      setAutomations(data.automations || []);
    } catch (error) {
      console.error('Failed to load automations:', error);
      toast({
        title: 'Error',
        description: 'Unable to load automations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const response = await fetch('/api/automation/run', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to run automations');
      const result = await response.json();
      toast({
        title: 'Automation run triggered',
        description: `${result.processed || 0} automation(s) processed`,
      });
      await loadAutomations();
    } catch (error) {
      console.error('Failed to run automations:', error);
      toast({
        title: 'Error',
        description: 'Unable to run automations',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Automations</h1>
            <p className="text-slate-600 mt-1">
              Monitor scheduled automations, review history, and trigger runs on
              demand.
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadAutomations}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button onClick={handleRunNow} disabled={running}>
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Now
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Automation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading automations...</span>
              </div>
            ) : automations.length === 0 ? (
              <div className="text-slate-600">No automations found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="p-2">Type</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Run At</th>
                      <th className="p-2">Last Attempt</th>
                      <th className="p-2">Attempts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {automations.map((automation) => (
                      <tr key={automation.id} className="hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-800">
                          {typeLabels[automation.type] || automation.type}
                        </td>
                        <td className="p-2">
                          <Badge
                            className={
                              statusColors[automation.status] ||
                              'bg-slate-100 text-slate-800'
                            }
                          >
                            {automation.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-slate-700">
                          {formatDate(automation.run_at)}
                        </td>
                        <td className="p-2 text-slate-700">
                          {formatDate(automation.last_attempt)}
                        </td>
                        <td className="p-2 text-slate-700">
                          {automation.attempts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {automations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Automation History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-slate-800">
                      {typeLabels[automation.type] || automation.type}
                    </div>
                    <div className="text-xs text-slate-500">
                      Run at {formatDate(automation.run_at)}
                    </div>
                  </div>
                  {automation.automation_history &&
                  automation.automation_history.length > 0 ? (
                    <ul className="space-y-1 text-sm text-slate-700">
                      {automation.automation_history
                        .sort((a, b) =>
                          (b.created_at || '').localeCompare(a.created_at || '')
                        )
                        .map((entry) => (
                          <li
                            key={entry.id}
                            className="flex justify-between gap-4"
                          >
                            <span>
                              <span className="font-semibold">
                                {entry.status}:
                              </span>{' '}
                              {entry.message || 'No message logged'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDate(entry.created_at)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-600">
                      No history recorded.
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
