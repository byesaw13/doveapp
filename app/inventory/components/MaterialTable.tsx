'use client';

import { useState } from 'react';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertDialogTrigger,
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
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No materials found</h3>
        <p className="mt-2 text-muted-foreground">
          Get started by adding your first material to inventory.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Stock Level</TableHead>
            <TableHead>Unit Cost</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => {
            const stockStatus = getStockStatus(material);
            const StatusIcon = stockStatus.icon;

            return (
              <TableRow key={material.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{material.name}</div>
                    {material.sku && (
                      <div className="text-sm text-muted-foreground">
                        SKU: {material.sku}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{material.category}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {material.current_stock}
                    </span>
                    <span className="text-muted-foreground">
                      {material.unit_of_measure}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Min: {material.min_stock} | Reorder:{' '}
                    {material.reorder_point}
                  </div>
                </TableCell>
                <TableCell>${material.unit_cost.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge
                    variant={stockStatus.variant}
                    className="flex items-center gap-1 w-fit"
                  >
                    <StatusIcon className="w-3 h-3" />
                    {stockStatus.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingMaterial(material)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingMaterial(material)}
                        className="text-destructive"
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
              Are you sure you want to delete "{deletingMaterial?.name}"? This
              action cannot be undone. The material will be marked as inactive
              but can be restored if needed.
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
