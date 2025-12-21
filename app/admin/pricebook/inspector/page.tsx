'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';

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

interface LineItemInput {
  id: number | string;
  quantity?: number;
  materialCost?: number;
  tier?: string;
}

interface CalculatedLineItem {
  serviceId: number;
  code: string;
  name: string;
  quantity: number;
  tier: string;
  laborPortion: number;
  materialsPortion: number;
  lineTotal: number;
}

interface EstimateResult {
  lineItems: CalculatedLineItem[];
  subtotal: number;
  adjustedTotal: number;
  appliedMinimum: boolean;
}

export default function PriceBookInspectorPage() {
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);

  // Form state
  const [formId, setFormId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [materialCost, setMaterialCost] = useState(0);
  const [tier, setTier] = useState('standard');
  const [calculationResult, setCalculationResult] =
    useState<EstimateResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Fetch data on mount
  useEffect(() => {
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
  }, []);

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

  // Handle row click
  const handleRowClick = (item: ServiceItem) => {
    setSelectedItem(item);
    setFormId(item.id.toString());
  };

  // Handle calculation
  const handleCalculate = async () => {
    if (!formId) return;

    setCalculating(true);
    try {
      const response = await fetch('/api/estimate/pricebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineItems: [
            {
              id: parseInt(formId) || formId,
              quantity: quantity || 1,
              materialCost: materialCost || 0,
              tier: tier,
            },
          ],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCalculationResult(result);
      } else {
        console.error('Calculation failed:', await response.text());
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading price book data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600">
          INTERNAL TOOL – NOT FOR CLIENTS
        </h1>
        <p className="text-gray-600 mt-2">Price Book Inspector</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Service Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="category">Filter by Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-md max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedItem?.id === item.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category_key}</Badge>
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
                      >
                        {item.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${item.standard_price}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Line Item Tester */}
      <Card>
        <CardHeader>
          <CardTitle>Line Item Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceId">Service ID</Label>
              <Input
                id="serviceId"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="Enter service ID or code"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="materialCost">Material Cost (optional)</Label>
              <Input
                id="materialCost"
                type="number"
                min="0"
                step="0.01"
                value={materialCost}
                onChange={(e) =>
                  setMaterialCost(parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (0.9x)</SelectItem>
                  <SelectItem value="standard">Standard (1.0x)</SelectItem>
                  <SelectItem value="premium">Premium (1.15x)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCalculate} disabled={calculating}>
            {calculating ? 'Calculating...' : 'Calculate Price'}
          </Button>

          {/* Results */}
          {calculationResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-4">Calculation Result</h3>
              <div className="space-y-2">
                {calculationResult.lineItems.map((item, index) => (
                  <div key={index} className="border-b pb-2">
                    <div className="font-medium">
                      {item.name} ({item.code})
                    </div>
                    <div className="text-sm text-gray-600">
                      Quantity: {item.quantity} | Tier: {item.tier}
                    </div>
                    <div className="text-sm">
                      Labor: ${item.laborPortion} | Materials: $
                      {item.materialsPortion} | Total: ${item.lineTotal}
                    </div>
                  </div>
                ))}
                <div className="pt-2 font-semibold">
                  <div>Subtotal: ${calculationResult.subtotal}</div>
                  <div>Adjusted Total: ${calculationResult.adjustedTotal}</div>
                  {calculationResult.appliedMinimum && (
                    <div className="text-red-600">
                      Minimum job total applied ($150)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
