'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Package,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaterialTable } from './components/MaterialTable';
import { MaterialForm } from './components/MaterialForm';
import { InventorySummary } from './components/InventorySummary';
import { AIToolRecognition } from './components/AIToolRecognition';
import { InventoryAnalyticsDashboard } from './components/InventoryAnalyticsDashboard';
import type {
  Material,
  InventorySummary as InventorySummaryType,
  StockAlert,
} from '@/types/materials';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [summary, setSummary] = useState<InventorySummaryType | null>(null);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch materials
  useEffect(() => {
    fetchMaterials();
  }, [searchTerm, selectedCategory, refreshTrigger]);

  // Fetch categories and analytics
  useEffect(() => {
    fetchCategories();
    fetchAnalytics();
  }, [refreshTrigger]);

  const fetchMaterials = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all')
        params.append('category', selectedCategory);

      const response = await fetch(`/api/materials?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/materials/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/materials/analytics/summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleMaterialCreated = () => {
    setShowAddDialog(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMaterialUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === 'critical'
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track materials, monitor stock levels, and manage supplies
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>
                Add a new material to your inventory with pricing and stock
                information.
              </DialogDescription>
            </DialogHeader>
            <MaterialForm onSuccess={handleMaterialCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-800">
                Critical Stock Alerts
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.material_id}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium">{alert.material_name}</span>
                  <Badge variant="destructive">
                    {alert.alert_type === 'out_of_stock'
                      ? 'Out of Stock'
                      : 'Low Stock'}
                  </Badge>
                </div>
              ))}
              {criticalAlerts.length > 3 && (
                <p className="text-sm text-red-600">
                  +{criticalAlerts.length - 3} more critical alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
          <TabsTrigger value="ai-recognition">AI Tool Recognition</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Summary Cards */}
          {summary && <InventorySummary summary={summary} />}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Materials</CardTitle>
              <CardDescription>
                Search and filter your inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <MaterialTable
                materials={materials}
                loading={loading}
                onMaterialUpdated={handleMaterialUpdated}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-recognition" className="space-y-6">
          <AIToolRecognition
            mode="inventory"
            onToolsRecognized={(tools) => {
              // Here you would typically update inventory counts
              // For now, just show a toast
              console.log('Recognized tools:', tools); // Keep for debugging
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <InventoryAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
