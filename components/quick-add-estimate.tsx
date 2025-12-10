'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/components/ui/toast';
import { FileText, Check, X, Plus, Trash2 } from 'lucide-react';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
}

interface QuickAddEstimateProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickAddEstimate({
  open = false,
  onOpenChange,
}: QuickAddEstimateProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    line_items: [] as LineItem[],
  });

  useEffect(() => {
    if (open) {
      // Load clients
      fetch('/api/clients')
        .then((res) => res.json())
        .then((data) => setClients(data))
        .catch((error) => console.error('Failed to load clients:', error));
    }
  }, [open]);

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          description: '',
          quantity: 1,
          unit_price: 0,
          unit: 'each',
        },
      ],
    }));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      line_items: prev.line_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeLineItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    return formData.line_items.reduce(
      (total, item) => total + item.quantity * item.unit_price,
      0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
          total: calculateTotal(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create estimate');
      }

      toast({
        title: 'Success',
        description: 'Estimate created successfully!',
      });

      // Reset form
      setFormData({
        client_id: '',
        title: '',
        description: '',
        line_items: [],
      });
      onOpenChange?.(false);
    } catch (error) {
      console.error('Failed to create estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to create estimate',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-purple-600" />
              Create New Estimate
            </DialogTitle>
            <DialogDescription>
              Create a quick estimate for a client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Selection */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Client *
              </label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Estimate Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Lawn Maintenance Estimate"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Additional details about the estimate..."
                rows={3}
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Line Items
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addLineItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {formData.line_items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-end p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Description
                      </label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, 'description', e.target.value)
                        }
                        placeholder="Service description"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Qty
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            'quantity',
                            parseFloat(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Unit
                      </label>
                      <Input
                        value={item.unit}
                        onChange={(e) =>
                          updateLineItem(index, 'unit', e.target.value)
                        }
                        placeholder="each"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Price
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            'unit_price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeLineItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {formData.line_items.length === 0 && (
                  <div className="text-center py-8 text-slate-500 border-2 border-dashed rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No line items added yet</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addLineItem}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add First Item
                    </Button>
                  </div>
                )}
              </div>

              {formData.line_items.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-600">
                      Total:{' '}
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || !formData.client_id || !formData.title
                }
                className="flex-1 bg-purple-500 hover:bg-purple-600"
              >
                <Check className="h-4 w-4 mr-1" />
                {isSubmitting ? 'Creating...' : 'Create Estimate'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
