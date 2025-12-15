'use client';

import { Package, DollarSign, AlertTriangle, TrendingDown } from 'lucide-react';
import type { InventorySummary as InventorySummaryType } from '@/types/materials';

interface InventorySummaryProps {
  summary: InventorySummaryType;
}

export function InventorySummary({ summary }: InventorySummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Materials Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
            <Package className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {summary.total_materials}
        </div>
        <p className="text-sm font-medium text-slate-600">Total Materials</p>
        <p className="text-xs text-slate-500 mt-1">Active inventory items</p>
      </div>

      {/* Total Value Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 p-6 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold text-emerald-700 mb-1">
          {formatCurrency(summary.total_value)}
        </div>
        <p className="text-sm font-semibold text-emerald-600">Total Value</p>
        <p className="text-xs text-emerald-600 mt-1">Current inventory value</p>
      </div>

      {/* Low Stock Alerts Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold text-amber-700 mb-1">
          {summary.low_stock_count}
        </div>
        <p className="text-sm font-medium text-slate-600">Low Stock</p>
        <p className="text-xs text-slate-500 mt-1">Items below minimum stock</p>
      </div>

      {/* Out of Stock Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-red-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
            <TrendingDown className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold text-red-700 mb-1">
          {summary.out_of_stock_count}
        </div>
        <p className="text-sm font-medium text-slate-600">Out of Stock</p>
        <p className="text-xs text-slate-500 mt-1">Items with zero stock</p>
      </div>
    </div>
  );
}
