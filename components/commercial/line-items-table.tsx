'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit?: string;
  tier?: string | null;
  code?: string;
  item_type?: string;
}

interface LineItemsTableProps {
  items: LineItem[];
  showCode?: boolean;
  showTier?: boolean;
  showType?: boolean;
  compact?: boolean;
  className?: string;
  onRowClick?: (item: LineItem, index: number) => void;
}

export function LineItemsTable({
  items,
  showCode = true,
  showTier = true,
  showType = false,
  compact = false,
  className,
  onRowClick,
}: LineItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No line items
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <Table>
        <TableHeader>
          <TableRow className={cn(compact && 'text-xs')}>
            {showCode && <TableHead className="w-20">Code</TableHead>}
            <TableHead>Description</TableHead>
            {showType && <TableHead className="w-24">Type</TableHead>}
            {showTier && <TableHead className="w-24">Tier</TableHead>}
            <TableHead className="text-center w-20">Qty</TableHead>
            <TableHead className="text-right w-28">Rate</TableHead>
            <TableHead className="text-right w-28">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow
              key={item.id || index}
              className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50')}
              onClick={() => onRowClick?.(item, index)}
            >
              {showCode && (
                <TableCell className="font-mono text-xs">
                  {item.code || '-'}
                </TableCell>
              )}
              <TableCell>
                <p className={cn('font-medium', compact && 'text-sm')}>
                  {item.description}
                </p>
                {item.unit && (
                  <p className="text-xs text-muted-foreground">
                    Unit: {item.unit}
                  </p>
                )}
              </TableCell>
              {showType && (
                <TableCell>
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.item_type || 'service'}
                  </Badge>
                </TableCell>
              )}
              {showTier && (
                <TableCell>
                  {item.tier ? (
                    <Badge variant="secondary" className="text-xs">
                      {item.tier}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-right">
                ${item.unit_price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium">
                ${item.total.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface LineItemsTotalsProps {
  subtotal: number;
  taxAmount?: number;
  taxRate?: number;
  discountAmount?: number;
  total: number;
  showLabels?: boolean;
  className?: string;
}

export function LineItemsTotals({
  subtotal,
  taxAmount,
  taxRate,
  discountAmount,
  total,
  showLabels = true,
  className,
}: LineItemsTotalsProps) {
  return (
    <div className={cn('space-y-2 pt-4 border-t', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      {taxAmount !== undefined && taxAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Tax{taxRate ? ` (${taxRate}%)` : ''}
          </span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
      )}
      {discountAmount !== undefined && discountAmount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>-${discountAmount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold pt-2 border-t">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
