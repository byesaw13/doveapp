'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface InventoryMetricsProps {
  data: AnalyticsData;
}

export function InventoryMetrics({ data }: InventoryMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const metrics = [
    {
      title: 'Total Inventory Value',
      value: formatCurrency(data.totalValue),
      change: data.monthlyValueChange,
      icon: DollarSign,
      description: 'Current total value of all inventory',
    },
    {
      title: 'Total Items',
      value: data.totalItems.toLocaleString(),
      change: data.monthlyUsageChange,
      icon: Package,
      description: 'Total number of inventory items',
    },
    {
      title: 'Low Stock Alerts',
      value: data.lowStockItems.toString(),
      change: null,
      icon: AlertTriangle,
      description: 'Items below minimum stock level',
      variant: data.lowStockItems > 0 ? 'warning' : 'default',
    },
    {
      title: 'Tools Due Maintenance',
      value: data.toolsDueMaintenance.toString(),
      change: null,
      icon: Wrench,
      description: 'Tools requiring maintenance',
      variant: data.toolsDueMaintenance > 0 ? 'warning' : 'default',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const isPositive = metric.change && metric.change > 0;
        const isNegative = metric.change && metric.change < 0;

        return (
          <Card
            key={metric.title}
            className={
              metric.variant === 'warning'
                ? 'border-orange-200 bg-orange-50'
                : ''
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon
                className={`h-4 w-4 ${metric.variant === 'warning' ? 'text-orange-600' : 'text-muted-foreground'}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
                {metric.change !== null && (
                  <div
                    className={`flex items-center text-xs ${
                      isPositive
                        ? 'text-green-600'
                        : isNegative
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : isNegative ? (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    ) : null}
                    {formatPercentage(metric.change)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
