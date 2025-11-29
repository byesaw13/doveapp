'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface StockTrend {
  date: string;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface StockLevelChartProps {
  data: StockTrend[];
  detailed?: boolean;
}

export function StockLevelChart({
  data,
  detailed = false,
}: StockLevelChartProps) {
  const maxValue = Math.max(
    ...data.flatMap((d) => [d.inStock, d.lowStock, d.outOfStock])
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Level Trends</CardTitle>
        <CardDescription>
          {detailed
            ? 'Detailed breakdown of stock levels over time'
            : 'Inventory stock status over the selected period'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Area */}
          <div className="h-64 flex items-end justify-between space-x-2">
            {data.map((point, index) => (
              <div
                key={point.date}
                className="flex flex-col items-center flex-1"
              >
                {/* Bars */}
                <div className="flex w-full items-end space-x-0.5">
                  {/* In Stock - Green */}
                  <div
                    className="bg-green-500 rounded-t flex-1 transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${(point.inStock / maxValue) * 200}px`,
                      minHeight: '4px',
                    }}
                    title={`In Stock: ${point.inStock}`}
                  />

                  {/* Low Stock - Yellow */}
                  <div
                    className="bg-yellow-500 rounded-t flex-1 transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${(point.lowStock / maxValue) * 200}px`,
                      minHeight: point.lowStock > 0 ? '4px' : '0px',
                    }}
                    title={`Low Stock: ${point.lowStock}`}
                  />

                  {/* Out of Stock - Red */}
                  <div
                    className="bg-red-500 rounded-t flex-1 transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${(point.outOfStock / maxValue) * 200}px`,
                      minHeight: point.outOfStock > 0 ? '4px' : '0px',
                    }}
                    title={`Out of Stock: ${point.outOfStock}`}
                  />
                </div>

                {/* Date Label */}
                <div className="text-xs text-muted-foreground mt-2 transform -rotate-45 origin-top">
                  {formatDate(point.date)}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm">In Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-sm">Low Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm">Out of Stock</span>
            </div>
          </div>

          {/* Summary Stats */}
          {detailed && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data[data.length - 1]?.inStock || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Currently In Stock
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {data[data.length - 1]?.lowStock || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Low Stock Items
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {data[data.length - 1]?.outOfStock || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Out of Stock
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
