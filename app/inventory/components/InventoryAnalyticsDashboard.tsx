'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Wrench,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryValueChart } from './analytics/InventoryValueChart';
import { StockLevelChart } from './analytics/StockLevelChart';
import { ToolUtilizationChart } from './analytics/ToolUtilizationChart';
import { MaintenanceAnalytics } from './analytics/MaintenanceAnalytics';
import { CostAnalysisChart } from './analytics/CostAnalysisChart';
import { InventoryMetrics } from './analytics/InventoryMetrics';

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

export function InventoryAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedCategory]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration - in production this would come from your API
      const mockData: AnalyticsData = {
        totalValue: 45280.5,
        totalItems: 234,
        lowStockItems: 12,
        outOfStockItems: 3,
        toolsAssigned: 8,
        toolsDueMaintenance: 5,
        monthlyValueChange: 8.5,
        monthlyUsageChange: -2.1,
        topCategories: [
          { category: 'Power Tools', value: 18500, count: 45 },
          { category: 'Hand Tools', value: 12800, count: 89 },
          { category: 'Safety Equipment', value: 8900, count: 67 },
          { category: 'Materials', value: 5080, count: 33 },
        ],
        stockTrends: [
          { date: '2024-01-01', inStock: 220, lowStock: 8, outOfStock: 2 },
          { date: '2024-01-08', inStock: 218, lowStock: 10, outOfStock: 3 },
          { date: '2024-01-15', inStock: 225, lowStock: 7, outOfStock: 1 },
          { date: '2024-01-22', inStock: 230, lowStock: 12, outOfStock: 3 },
        ],
        toolUtilization: [
          {
            toolName: 'Makita Cordless Drill',
            utilizationRate: 85,
            totalAssignments: 24,
            avgDuration: 6.5,
          },
          {
            toolName: 'Stanley Hammer Set',
            utilizationRate: 72,
            totalAssignments: 18,
            avgDuration: 4.2,
          },
          {
            toolName: 'Craftsman Wrench Set',
            utilizationRate: 68,
            totalAssignments: 15,
            avgDuration: 5.8,
          },
          {
            toolName: 'Bosch Circular Saw',
            utilizationRate: 45,
            totalAssignments: 8,
            avgDuration: 3.1,
          },
        ],
        maintenanceStats: {
          scheduled: 12,
          completed: 8,
          overdue: 3,
          avgCost: 125.5,
        },
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // In production, this would generate and download a PDF/Excel report
    alert('Report export functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No Analytics Data</h3>
        <p className="mt-2 text-muted-foreground">
          Unable to load inventory analytics at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your inventory performance and trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="tools">Tools Only</SelectItem>
              <SelectItem value="materials">Materials Only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <InventoryMetrics data={analyticsData} />

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="value">Value & Cost</TabsTrigger>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="tools">Tool Usage</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryValueChart data={analyticsData.stockTrends} />
            <StockLevelChart data={analyticsData.stockTrends} />
          </div>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Categories by Value</CardTitle>
              <CardDescription>
                Your most valuable inventory categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topCategories.map((category, index) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.count} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${category.value.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${(category.value / category.count).toFixed(2)} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value" className="space-y-6">
          <CostAnalysisChart data={analyticsData} />
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <StockLevelChart data={analyticsData.stockTrends} detailed />
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <ToolUtilizationChart data={analyticsData.toolUtilization} />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <MaintenanceAnalytics data={analyticsData.maintenanceStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
