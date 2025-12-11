'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  DollarSign,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';

export interface FilterOption {
  id: string;
  label: string;
  value: any;
}

export interface AdvancedFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  onDateRangeChange?: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
  amountRange?: {
    min: number | undefined;
    max: number | undefined;
  };
  onAmountRangeChange?: (range: {
    min: number | undefined;
    max: number | undefined;
  }) => void;
  statusOptions?: FilterOption[];
  selectedStatuses?: string[];
  onStatusChange?: (statuses: string[]) => void;
  clientOptions?: FilterOption[];
  selectedClients?: string[];
  onClientChange?: (clients: string[]) => void;
  quickFilters?: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }[];
  onClearAll?: () => void;
}

export default function AdvancedFilters({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  amountRange,
  onAmountRangeChange,
  statusOptions = [],
  selectedStatuses = [],
  onStatusChange,
  clientOptions = [],
  selectedClients = [],
  onClientChange,
  quickFilters = [],
  onClearAll,
}: AdvancedFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const hasActiveFilters =
    dateRange?.from ||
    dateRange?.to ||
    amountRange?.min ||
    amountRange?.max ||
    selectedStatuses.length > 0 ||
    selectedClients.length > 0;

  const activeFilterCount =
    (dateRange?.from ? 1 : 0) +
    (dateRange?.to ? 1 : 0) +
    (amountRange?.min ? 1 : 0) +
    (amountRange?.max ? 1 : 0) +
    selectedStatuses.length +
    selectedClients.length;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        {/* Main Search and Quick Actions */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by job number, title, or customer name..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Quick Filters */}
          {quickFilters.length > 0 && (
            <div className="flex gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  onClick={filter.onClick}
                  className="flex items-center gap-2"
                >
                  {filter.icon}
                  {filter.label}
                </Button>
              ))}
            </div>
          )}

          {/* Advanced Filters Toggle */}
          <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Advanced Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Advanced Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearAll}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Date Range Filter */}
                {onDateRangeChange && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Date Range
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600">From</Label>
                        <Input
                          type="date"
                          value={
                            dateRange?.from
                              ? format(dateRange.from, 'yyyy-MM-dd')
                              : ''
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            onDateRangeChange({
                              from: date,
                              to: dateRange?.to,
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">To</Label>
                        <Input
                          type="date"
                          value={
                            dateRange?.to
                              ? format(dateRange.to, 'yyyy-MM-dd')
                              : ''
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            onDateRangeChange({
                              from: dateRange?.from,
                              to: date,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount Range Filter */}
                {onAmountRangeChange && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Amount Range
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600">Min ($)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={amountRange?.min || ''}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseFloat(e.target.value)
                              : undefined;
                            onAmountRangeChange({
                              min: value,
                              max: amountRange?.max,
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Max ($)</Label>
                        <Input
                          type="number"
                          placeholder="No limit"
                          value={amountRange?.max || ''}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseFloat(e.target.value)
                              : undefined;
                            onAmountRangeChange({
                              min: amountRange?.min,
                              max: value,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Filter */}
                {onStatusChange && statusOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {statusOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`status-${option.id}`}
                            checked={selectedStatuses.includes(option.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onStatusChange([
                                  ...selectedStatuses,
                                  option.id,
                                ]);
                              } else {
                                onStatusChange(
                                  selectedStatuses.filter(
                                    (s) => s !== option.id
                                  )
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`status-${option.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client Filter */}
                {onClientChange && clientOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Clients</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {clientOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`client-${option.id}`}
                            checked={selectedClients.includes(option.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onClientChange([...selectedClients, option.id]);
                              } else {
                                onClientChange(
                                  selectedClients.filter((c) => c !== option.id)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`client-${option.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {dateRange?.from && (
              <Badge variant="secondary" className="flex items-center gap-1">
                From: {format(dateRange.from, 'MMM d, yyyy')}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() =>
                    onDateRangeChange?.({ from: undefined, to: dateRange.to })
                  }
                />
              </Badge>
            )}
            {dateRange?.to && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {format(dateRange.to, 'MMM d, yyyy')}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() =>
                    onDateRangeChange?.({ from: dateRange.from, to: undefined })
                  }
                />
              </Badge>
            )}
            {amountRange?.min && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Min: ${amountRange.min}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() =>
                    onAmountRangeChange?.({
                      min: undefined,
                      max: amountRange.max,
                    })
                  }
                />
              </Badge>
            )}
            {amountRange?.max && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Max: ${amountRange.max}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() =>
                    onAmountRangeChange?.({
                      min: amountRange.min,
                      max: undefined,
                    })
                  }
                />
              </Badge>
            )}
            {selectedStatuses.map((status) => {
              const option = statusOptions.find((o) => o.id === status);
              return (
                <Badge
                  key={status}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {option?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() =>
                      onStatusChange?.(
                        selectedStatuses.filter((s) => s !== status)
                      )
                    }
                  />
                </Badge>
              );
            })}
            {selectedClients.map((clientId) => {
              const option = clientOptions.find((o) => o.id === clientId);
              return (
                <Badge
                  key={clientId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {option?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() =>
                      onClientChange?.(
                        selectedClients.filter((c) => c !== clientId)
                      )
                    }
                  />
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
