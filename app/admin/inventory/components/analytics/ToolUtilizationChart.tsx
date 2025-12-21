'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ToolUtilization {
  toolName: string;
  utilizationRate: number;
  totalAssignments: number;
  avgDuration: number;
}

interface ToolUtilizationChartProps {
  data: ToolUtilization[];
}

export function ToolUtilizationChart({ data }: ToolUtilizationChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Utilization</CardTitle>
        <CardDescription>
          How effectively your tools are being used
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((tool, index) => (
            <div key={tool.toolName} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{tool.toolName}</span>
                <Badge
                  variant={
                    tool.utilizationRate > 70
                      ? 'default'
                      : tool.utilizationRate > 40
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {tool.utilizationRate}% utilized
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${tool.utilizationRate}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{tool.totalAssignments} assignments</span>
                <span>Avg {tool.avgDuration} days</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
