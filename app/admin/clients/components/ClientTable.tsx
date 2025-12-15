'use client';

import type { Client } from '@/types/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onViewDetails?: (client: Client) => void;
}

export function ClientTable({
  clients,
  onEdit,
  onDelete,
  onViewDetails,
}: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No clients found. Add your first client to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">
                {onViewDetails ? (
                  <button
                    onClick={() => onViewDetails(client)}
                    className="text-left hover:underline text-blue-600 hover:text-blue-800"
                  >
                    {client.first_name} {client.last_name}
                  </button>
                ) : (
                  `${client.first_name} ${client.last_name}`
                )}
              </TableCell>
              <TableCell>{client.company_name || '-'}</TableCell>
              <TableCell>{client.email || '-'}</TableCell>
              <TableCell>{client.phone || '-'}</TableCell>
              <TableCell>{client.city || '-'}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(client)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(client)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
