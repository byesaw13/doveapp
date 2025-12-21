'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface StockTrend {
  date: string;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface InventoryValueChartProps {
  data: StockTrend[];
}

export function InventoryValueChart({ data }: InventoryValueChartProps) {
  // Calculate total value trend (mock calculation)
  const totalValue = data.reduce((sum, point) => sum + point.inStock * 25, 0); // $25 avg per item
  const previousValue = totalValue * 0.92; // Mock previous period
  const change = ((totalValue - previousValue) / previousValue) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Value Trend</CardTitle>
        <CardDescription>Total inventory value over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">
              ${totalValue.toLocaleString()}
            </div>
            <div
              className={`flex items-center justify-center text-sm ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 mr-1 ${change < 0 ? 'rotate-180' : ''}`}
              />
              {change >= 0 ? '+' : ''}
              {change.toFixed(1)}% from last period
            </div>
          </div>

          {/* Simple trend visualization */}
          <div className="h-32 flex items-end justify-center space-x-2">
            {data.map((point, index) => {
              const value = point.inStock * 25;
              const height = (value / totalValue) * 100;
              return (
                <div
                  key={point.date}
                  className="bg-blue-500 rounded-t w-8 transition-all duration-300 hover:bg-blue-600"
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`$${value.toLocaleString()}`}
                />
              );
            })}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Value per item: $25 (average)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
