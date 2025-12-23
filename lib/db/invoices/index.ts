// Invoice database operations - barrel export
export { createInvoiceFromJob } from './creation';
export {
  getInvoiceByIdWithRelations,
  listInvoicesWithFilters,
  getInvoicesByJobId,
} from './queries';
export { updateInvoiceStatus } from './updates';
export { addInvoicePayment, deleteInvoicePayment } from './payments';
export { getInvoiceStats } from './stats';

// Re-export types for convenience
export type {
  Invoice,
  InvoiceWithRelations,
  InvoiceLineItem,
  InvoicePayment,
  InvoiceStatus,
  PaymentMethod,
} from '@/types/invoice';
export type { CreateInvoiceFromJobOptions } from './creation';
