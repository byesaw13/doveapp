'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface MaintenanceStats {
  scheduled: number;
  completed: number;
  overdue: number;
  avgCost: number;
}

interface MaintenanceAnalyticsProps {
  data: MaintenanceStats;
}

export function MaintenanceAnalytics({ data }: MaintenanceAnalyticsProps) {
  const totalMaintenance = data.scheduled + data.completed + data.overdue;
  const completionRate =
    totalMaintenance > 0 ? (data.completed / totalMaintenance) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Analytics</CardTitle>
        <CardDescription>
          Tool maintenance scheduling and completion tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Completion Rate */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {completionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Maintenance Completion Rate
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {data.completed}
              </div>
              <div className="text-sm text-green-700">Completed</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {data.scheduled}
              </div>
              <div className="text-sm text-blue-700">Scheduled</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {data.overdue}
              </div>
              <div className="text-sm text-red-700">Overdue</div>
            </div>
          </div>

          {/* Average Cost */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Average Maintenance Cost
              </span>
              <span className="text-lg font-bold">
                ${data.avgCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Maintenance Schedule Preview */}
          <div className="space-y-2">
            <h4 className="font-medium">Upcoming Maintenance</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Makita Drill - Annual Service</span>
                <Badge variant="outline">Due in 3 days</Badge>
              </div>
              <div className="flex justify-between">
                <span>Craftsman Wrench Set - Inspection</span>
                <Badge variant="outline">Due in 1 week</Badge>
              </div>
              <div className="flex justify-between">
                <span>Bosch Circular Saw - Calibration</span>
                <Badge variant="destructive">Overdue</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
