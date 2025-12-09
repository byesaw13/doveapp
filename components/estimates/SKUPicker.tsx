'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus } from 'lucide-react';

interface ServiceItem {
  id: number;
  code: string;
  name: string;
  category_key: string;
  tier: string;
  standard_price: number;
}

interface ServiceCategory {
  id: number;
  key: string;
  name: string;
  code_range: string;
  description: string;
}

interface SKUPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSKU: (sku: ServiceItem) => void;
}

export default function SKUPicker({
  open,
  onOpenChange,
  onSelectSKU,
}: SKUPickerProps) {
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data on mount
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        const [itemsRes, categoriesRes] = await Promise.all([
          fetch('/api/estimate/pricebook?action=items'),
          fetch('/api/estimate/pricebook?action=categories'),
        ]);

        if (itemsRes.ok) {
          const items = await itemsRes.json();
          setServiceItems(items);
        }

        if (categoriesRes.ok) {
          const cats = await categoriesRes.json();
          setCategories(cats);
        }
      } catch (error) {
        console.error('Error fetching price book data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open]);

  // Filter items
  const filteredItems = serviceItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category_key === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectSKU = (item: ServiceItem) => {
    onSelectSKU(item);
    onOpenChange(false);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select Service Item</DialogTitle>
          <DialogDescription>
            Choose a service item from the price book to add to your estimate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Filters */}
          <div className="flex gap-4 flex-shrink-0">
            <div className="flex-1">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg flex-1 min-h-0 overflow-hidden flex flex-col bg-white">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8 text-slate-500">
                  Loading service items...
                </div>
              </div>
            ) : (
              <div className="overflow-auto flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 z-10">
                    <TableRow>
                      <TableHead className="w-20 font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="w-32 font-semibold">
                        Category
                      </TableHead>
                      <TableHead className="w-24 font-semibold">Tier</TableHead>
                      <TableHead className="w-24 text-right font-semibold">
                        Price
                      </TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-slate-500"
                        >
                          No service items found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50">
                          <TableCell className="font-mono text-sm">
                            {item.code}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs whitespace-nowrap"
                            >
                              {item.category_key}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.tier === 'core'
                                  ? 'default'
                                  : item.tier === 'standard'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                              className="text-xs"
                            >
                              {item.tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            ${item.standard_price}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleSelectSKU(item)}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
