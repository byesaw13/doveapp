'use client';

import { useState } from 'react';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MaterialForm } from './MaterialForm';
import type { Material } from '@/types/materials';

interface MaterialTableProps {
  materials: Material[];
  loading: boolean;
  onMaterialUpdated: () => void;
}

export function MaterialTable({
  materials,
  loading,
  onMaterialUpdated,
}: MaterialTableProps) {
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(
    null
  );

  const getStockStatus = (material: Material) => {
    if (material.current_stock === 0) {
      return {
        label: 'Out of Stock',
        variant: 'destructive' as const,
        icon: AlertTriangle,
      };
    }
    if (material.current_stock <= material.min_stock) {
      return {
        label: 'Low Stock',
        variant: 'secondary' as const,
        icon: AlertTriangle,
      };
    }
    if (material.current_stock <= material.reorder_point) {
      return {
        label: 'Reorder Soon',
        variant: 'outline' as const,
        icon: Package,
      };
    }
    return { label: 'In Stock', variant: 'default' as const, icon: Package };
  };

  const handleDelete = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onMaterialUpdated();
        setDeletingMaterial(null);
      } else {
        console.error('Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleEditSuccess = () => {
    setEditingMaterial(null);
    onMaterialUpdated();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          <div className="text-slate-600">Loading materials...</div>
        </div>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Package className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No materials found
        </h3>
        <p className="text-sm text-slate-600">
          Get started by adding your first material to inventory.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200">
              <TableHead className="text-slate-900 font-semibold">
                Name
              </TableHead>
              <TableHead className="text-slate-900 font-semibold">
                Category
              </TableHead>
              <TableHead className="text-slate-900 font-semibold">
                Stock Level
              </TableHead>
              <TableHead className="text-slate-900 font-semibold">
                Unit Cost
              </TableHead>
              <TableHead className="text-slate-900 font-semibold">
                Status
              </TableHead>
              <TableHead className="text-slate-900 font-semibold w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => {
              const stockStatus = getStockStatus(material);
              const StatusIcon = stockStatus.icon;

              return (
                <TableRow
                  key={material.id}
                  className="hover:bg-slate-50 transition-colors border-slate-200"
                >
                  <TableCell className="font-medium text-slate-900">
                    <div>
                      <div className="font-medium">{material.name}</div>
                      {material.sku && (
                        <div className="text-sm text-slate-500">
                          SKU: {material.sku}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {material.category}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {material.current_stock}
                      </span>
                      <span className="text-slate-500">
                        {material.unit_of_measure}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      Min: {material.min_stock} | Reorder:{' '}
                      {material.reorder_point}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-900">
                    ${material.unit_cost.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        stockStatus.variant === 'destructive'
                          ? 'bg-red-100 text-red-800'
                          : stockStatus.variant === 'secondary'
                            ? 'bg-amber-100 text-amber-800'
                            : stockStatus.variant === 'outline'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {stockStatus.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-slate-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white border-slate-200"
                      >
                        <DropdownMenuItem
                          onClick={() => setEditingMaterial(material)}
                          className="hover:bg-slate-50 text-slate-700"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingMaterial(material)}
                          className="hover:bg-red-50 text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingMaterial}
        onOpenChange={() => setEditingMaterial(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>
              Update material information and stock levels.
            </DialogDescription>
          </DialogHeader>
          {editingMaterial && (
            <MaterialForm
              material={editingMaterial}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingMaterial}
        onOpenChange={() => setDeletingMaterial(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingMaterial?.name}
              &quot;? This action cannot be undone. The material will be marked
              as inactive but can be restored if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMaterial && handleDelete(deletingMaterial)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
