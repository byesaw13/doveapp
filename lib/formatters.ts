import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMM d, yyyy');
  } catch {
    return 'Invalid Date';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMM d, yyyy h:mm a');
  } catch {
    return 'Invalid Date';
  }
}

export function formatRelativeDate(
  date: string | Date | null | undefined
): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'Invalid Date';
  }
}

export function formatCurrency(
  amount: number | null | undefined,
  currency = 'USD'
): string {
  if (amount == null) return '$0.00';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '0';
  try {
    return new Intl.NumberFormat('en-US').format(num);
  } catch {
    return num.toString();
  }
}

export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return '0%';
  try {
    return `${value.toFixed(1)}%`;
  } catch {
    return `${value}%`;
  }
}

export function formatStatus(status: string): string {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatJobStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    quote: 'Quote Sent',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    invoiced: 'Invoiced',
    cancelled: 'Cancelled',
  };
  return statusMap[status] || formatStatus(status);
}

export function formatEstimateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    approved: 'Approved',
    changes_requested: 'Changes Requested',
    expired: 'Expired',
  };
  return statusMap[status] || formatStatus(status);
}

export function formatInvoiceStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    partial: 'Partially Paid',
    paid: 'Paid',
    void: 'Void',
  };
  return statusMap[status] || formatStatus(status);
}
