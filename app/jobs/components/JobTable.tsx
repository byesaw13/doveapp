'use client';

import type { JobWithClient } from '@/types/job';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface JobTableProps {
  jobs: JobWithClient[];
  onEdit: (job: JobWithClient) => void;
  onDelete: (job: JobWithClient) => void;
  onViewDetails: (job: JobWithClient) => void;
  onStatusChange: (jobId: string, newStatus: JobWithClient['status']) => void;
}

const statusColors = {
  quote: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  invoiced: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  quote: 'Quote',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  invoiced: 'Invoiced',
  cancelled: 'Cancelled',
};

export function JobTable({
  jobs,
  onEdit,
  onDelete,
  onViewDetails,
  onStatusChange,
}: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No jobs found. Create your first job to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Service Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-mono text-sm">
                {job.job_number}
              </TableCell>
              <TableCell className="font-medium">{job.title}</TableCell>
              <TableCell>
                {job.client.first_name} {job.client.last_name}
              </TableCell>
              <TableCell>
                <Select
                  value={job.status}
                  onValueChange={(newStatus) =>
                    onStatusChange(job.id, newStatus as JobWithClient['status'])
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}
                      >
                        {statusLabels[job.status]}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : job.payment_status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {job.payment_status === 'paid'
                    ? 'Paid'
                    : job.payment_status === 'partial'
                      ? 'Partial'
                      : 'Unpaid'}
                </span>
              </TableCell>
              <TableCell>
                {job.service_date
                  ? new Date(job.service_date).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>${job.total.toFixed(2)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(job)}
                >
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(job)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(job)}
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
