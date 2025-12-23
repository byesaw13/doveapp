import { supabase } from '@/lib/supabase';

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  overdue: number;
  totalRevenue: number;
  averageInvoiceValue: number;
}> {
  // Get all invoices with payments
  const { data: invoices, error } = await supabase.from('invoices').select(`
      status,
      total,
      due_date,
      payments:invoice_payments(amount)
    `);

  if (error) {
    throw new Error(`Failed to get invoice stats: ${error.message}`);
  }

  const stats = {
    total: invoices?.length || 0,
    byStatus: {} as Record<string, number>,
    overdue: 0,
    totalRevenue: 0,
    averageInvoiceValue: 0,
  };

  let totalValue = 0;

  invoices?.forEach((invoice: any) => {
    // Count by status
    stats.byStatus[invoice.status] = (stats.byStatus[invoice.status] || 0) + 1;

    // Calculate total revenue (sum of all payments)
    const paidAmount =
      invoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    stats.totalRevenue += paidAmount;

    // Check for overdue
    if (invoice.status !== 'paid' && invoice.due_date) {
      const dueDate = new Date(invoice.due_date);
      const now = new Date();
      if (dueDate < now) {
        stats.overdue++;
      }
    }

    totalValue += invoice.total;
  });

  stats.averageInvoiceValue = stats.total > 0 ? totalValue / stats.total : 0;

  return stats;
}
