'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PropertyWithClient } from '@/types/property';

interface PropertyTableProps {
  properties: PropertyWithClient[];
  loading: boolean;
  onEdit: (property: PropertyWithClient) => void;
  onDelete: (property: PropertyWithClient) => void;
}

export function PropertyTable({
  properties,
  loading,
  onEdit,
  onDelete,
}: PropertyTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading properties...</div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">No properties found</div>
        <div className="text-sm text-muted-foreground">
          Add your first property to get started
        </div>
      </div>
    );
  }

  const formatAddress = (property: PropertyWithClient) => {
    const parts = [
      property.address_line1,
      property.address_line2,
      property.city,
      property.state,
      property.zip_code,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'No address';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property Name</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((property) => (
          <TableRow key={property.id}>
            <TableCell className="font-medium">{property.name}</TableCell>
            <TableCell>
              {property.client.first_name} {property.client.last_name}
              {property.client.company_name && (
                <div className="text-sm text-muted-foreground">
                  {property.client.company_name}
                </div>
              )}
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {formatAddress(property)}
            </TableCell>
            <TableCell>
              {property.property_type && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {property.property_type}
                </span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(property)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(property)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
