'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
    <div className="space-y-6">
      {/* Header - Jobber style with emerald gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-10 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white">
                Inventory Management
              </h1>
              <p className="mt-2 text-emerald-50 text-sm">
                Track materials, monitor stock levels, and manage supplies
              </p>
            </div>
            <div className="flex-shrink-0">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <button className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-500 inline-flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Material
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Material</DialogTitle>
                    <DialogDescription>
                      Add a new material to your inventory with pricing and
                      stock information.
                    </DialogDescription>
                  </DialogHeader>
                  <MaterialForm onSuccess={handleMaterialCreated} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts - Jobber style */}
      {criticalAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-red-800">
              Critical Stock Alerts
            </h2>
          </div>
          <div className="space-y-3">
            {criticalAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.material_id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <span className="font-medium text-red-900">
                  {alert.material_name}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {alert.alert_type === 'out_of_stock'
                    ? 'Out of Stock'
                    : 'Low Stock'}
                </span>
              </div>
            ))}
            {criticalAlerts.length > 3 && (
              <p className="text-sm text-red-600 font-medium">
                +{criticalAlerts.length - 3} more critical alerts
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tabs - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <Tabs defaultValue="inventory" className="w-full">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger
                value="inventory"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Inventory Management
              </TabsTrigger>
              <TabsTrigger
                value="ai-recognition"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                AI Tool Recognition
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inventory" className="p-6 space-y-6">
            {/* Summary Cards */}
            {summary && <InventorySummary summary={summary} />}

            {/* Materials Section - Jobber style */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Materials
                    </h2>
                    <p className="text-sm text-slate-600">
                      Search and filter your inventory
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-recognition" className="p-6 space-y-6">
            <AIToolRecognition
              mode="inventory"
              onToolsRecognized={(tools) => {
                // Here you would typically update inventory counts
                // For now, just show a toast
                console.log('Recognized tools:', tools); // Keep for debugging
              }}
            />
          </TabsContent>

          <TabsContent value="analytics" className="p-6 space-y-6">
            <InventoryAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
