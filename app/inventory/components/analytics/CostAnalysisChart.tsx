'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wrench,
} from 'lucide-react';

interface AnalyticsData {
  totalValue: number;
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  toolsAssigned: number;
  toolsDueMaintenance: number;
  monthlyValueChange: number;
  monthlyUsageChange: number;
  topCategories: Array<{
    category: string;
    value: number;
    count: number;
  }>;
  stockTrends: Array<{
    date: string;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }>;
  toolUtilization: Array<{
    toolName: string;
    utilizationRate: number;
    totalAssignments: number;
    avgDuration: number;
  }>;
  maintenanceStats: {
    scheduled: number;
    completed: number;
    overdue: number;
    avgCost: number;
  };
}

interface CostAnalysisChartProps {
  data: AnalyticsData;
}

export function CostAnalysisChart({ data }: CostAnalysisChartProps) {
  const avgItemCost =
    data.totalItems > 0 ? data.totalValue / data.totalItems : 0;
  const maintenanceCostPerItem =
    data.totalItems > 0
      ? (data.maintenanceStats.avgCost * data.maintenanceStats.completed) /
        data.totalItems
      : 0;

  const costBreakdown = [
    {
      category: 'Inventory Value',
      amount: data.totalValue,
      percentage: 100,
      color: 'bg-blue-500',
      description: 'Total current inventory value',
    },
    {
      category: 'Maintenance Costs',
      amount: data.maintenanceStats.avgCost * data.maintenanceStats.completed,
      percentage:
        data.totalValue > 0
          ? ((data.maintenanceStats.avgCost * data.maintenanceStats.completed) /
              data.totalValue) *
            100
          : 0,
      color: 'bg-orange-500',
      description: 'Total maintenance expenses',
    },
    {
      category: 'Low Stock Impact',
      amount: data.lowStockItems * avgItemCost * 0.1, // Estimated carrying cost
      percentage:
        data.totalValue > 0
          ? ((data.lowStockItems * avgItemCost * 0.1) / data.totalValue) * 100
          : 0,
      color: 'bg-yellow-500',
      description: 'Estimated cost of stockouts',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Analysis</CardTitle>
        <CardDescription>
          Breakdown of inventory costs and financial impact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Cost Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                ${avgItemCost.toFixed(2)}
              </div>
              <div className="text-sm text-blue-700">Avg Cost per Item</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                ${maintenanceCostPerItem.toFixed(2)}
              </div>
              <div className="text-sm text-green-700">
                Maintenance Cost per Item
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-4">
            <h4 className="font-medium">Cost Breakdown</h4>
            {costBreakdown.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.category}</span>
                    <div className="text-sm text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      ${item.amount.toLocaleString()}
                    </div>
                    <Badge variant="outline">
                      {item.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Cost Trends */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Cost Trends</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Monthly Value Change</span>
                <div
                  className={`flex items-center text-sm ${
                    data.monthlyValueChange >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {data.monthlyValueChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {data.monthlyValueChange >= 0 ? '+' : ''}
                  {data.monthlyValueChange.toFixed(1)}%
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Maintenance Cost Trend</span>
                <Badge variant="outline">
                  ${data.maintenanceStats.avgCost.toFixed(2)} avg per
                  maintenance
                </Badge>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">
              Cost Optimization Recommendations
            </h4>
            <div className="space-y-2 text-sm">
              {data.lowStockItems > 5 && (
                <div className="flex items-start space-x-2 p-2 bg-yellow-50 rounded">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <span className="text-yellow-800">
                    High low-stock items ({data.lowStockItems}) may increase
                    carrying costs. Consider bulk purchasing.
                  </span>
                </div>
              )}

              {data.maintenanceStats.avgCost > 200 && (
                <div className="flex items-start space-x-2 p-2 bg-orange-50 rounded">
                  <Wrench className="w-4 h-4 text-orange-600 mt-0.5" />
                  <span className="text-orange-800">
                    High maintenance costs (${data.maintenanceStats.avgCost}).
                    Review maintenance schedules.
                  </span>
                </div>
              )}

              {data.monthlyValueChange < -5 && (
                <div className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                  <TrendingDown className="w-4 h-4 text-red-600 mt-0.5" />
                  <span className="text-red-800">
                    Inventory value declining. Review purchasing and usage
                    patterns.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
