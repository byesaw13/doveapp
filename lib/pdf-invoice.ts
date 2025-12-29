import jsPDF from 'jspdf';
import type {
  InvoiceWithRelations,
  InvoiceLineItem,
  InvoicePayment,
} from '@/types/invoice';

interface InvoicePdfOptions {
  invoiceId: string;
}

export async function generateInvoicePdf(
  options: InvoicePdfOptions
): Promise<Buffer> {
  const { invoiceId } = options;

  // Import here to avoid circular dependencies
  const { getInvoiceByIdWithRelations } = await import('@/lib/db/invoices');

  const invoice = await getInvoiceByIdWithRelations(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Create new PDF document
  const doc = new jsPDF();

  // Set up colors and fonts (matching estimate styling)
  const primaryColor = [46, 125, 50]; // Green
  const secondaryColor = [96, 125, 139]; // Blue Grey
  const textColor = [33, 33, 33]; // Dark Grey

  // Helper function to add text with proper formatting
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(options.fontSize || 10);
    if (options.font) doc.setFont(options.font);
    if (options.align) doc.text(text, x, y, { align: options.align });
    else doc.text(text, x, y);
  };

  // Helper function to add colored text
  const addColoredText = (
    text: string,
    x: number,
    y: number,
    color: number[],
    fontSize: number = 10
  ) => {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(fontSize);
    doc.text(text, x, y);
  };

  let yPosition = 20;

  // Header with logo and company info
  try {
    // Add logo placeholder - in production, you'd load the actual logo
    // For now, we'll add a styled company name as logo placeholder
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, yPosition, 40, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('DOVETAILS', 40, yPosition + 8, { align: 'center' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  } catch (error) {
    console.log('Logo rendering failed, using text placeholder');
    addText('DOVETAILS', 40, yPosition + 12, { fontSize: 10, align: 'center' });
  }

  // Company info
  addColoredText('Dovetails Services', 70, yPosition + 5, primaryColor, 16);
  addText('123 Main Street', 70, yPosition + 15);
  addText('Anytown, ST 12345', 70, yPosition + 25);
  addText('Phone: (555) 123-4567', 70, yPosition + 35);
  addText('Email: info@dovetails.com', 70, yPosition + 45);

  yPosition += 60;

  // Invoice header
  addColoredText('INVOICE', 20, yPosition, primaryColor, 20);
  yPosition += 15;

  // Invoice details
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);

  yPosition += 10;

  addText(`Invoice #: ${invoice.invoice_number}`, 20, yPosition);
  addText(
    `Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`,
    140,
    yPosition
  );
  yPosition += 10;

  if (invoice.due_date) {
    addText(
      `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`,
      20,
      yPosition
    );
  }

  if (invoice.job) {
    yPosition += 10;
    addText(`Job #: ${invoice.job.job_number}`, 20, yPosition);
  }

  yPosition += 20;

  // Bill To section
  addColoredText('BILL TO:', 20, yPosition, secondaryColor, 12);
  yPosition += 10;

  const customer = invoice.client;
  if (customer) {
    addText(`${customer.first_name} ${customer.last_name}`, 20, yPosition);
    if (customer.email) {
      yPosition += 8;
      addText(customer.email, 20, yPosition);
    }
    if (customer.phone) {
      yPosition += 8;
      addText(customer.phone, 20, yPosition);
    }
  }

  yPosition += 20;

  // Line items table
  const tableStartY = yPosition;
  const colWidths = [80, 20, 30, 30]; // Description, Qty, Unit Price, Amount
  const colPositions = [20, 100, 130, 160];

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition, 170, 10, 'F');

  addColoredText(
    'DESCRIPTION',
    colPositions[0] + 2,
    yPosition + 7,
    textColor,
    10
  );
  addColoredText('QTY', colPositions[1] + 2, yPosition + 7, textColor, 10);
  addColoredText('RATE', colPositions[2] + 2, yPosition + 7, textColor, 10);
  addColoredText('AMOUNT', colPositions[3] + 2, yPosition + 7, textColor, 10);

  yPosition += 15;

  // Table header
  addColoredText(
    'DESCRIPTION',
    colPositions[0] + 2,
    yPosition + 7,
    textColor,
    9
  );
  addColoredText('QTY', colPositions[1] + 2, yPosition + 7, textColor, 9);
  addColoredText(
    'UNIT PRICE',
    colPositions[2] + 2,
    yPosition + 7,
    textColor,
    9
  );
  addColoredText('AMOUNT', colPositions[3] + 2, yPosition + 7, textColor, 9);

  yPosition += 15;

  // Table rows
  if (invoice.invoice_line_items && invoice.invoice_line_items.length > 0) {
    invoice.invoice_line_items.forEach(
      (item: InvoiceLineItem, index: number) => {
        const rowY = yPosition + index * 12;

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(20, rowY - 4, 170, 10, 'F');
        }

        addText(item.description, colPositions[0] + 2, rowY + 3, {
          fontSize: 8,
        });
        addText(item.quantity.toString(), colPositions[1] + 2, rowY + 3, {
          fontSize: 8,
        });
        addText(
          `$${item.unit_price.toFixed(2)}`,
          colPositions[2] + 2,
          rowY + 3,
          {
            fontSize: 8,
          }
        );
        addText(
          `$${item.line_total.toFixed(2)}`,
          colPositions[3] + 2,
          rowY + 3,
          {
            fontSize: 8,
          }
        );
      }
    );

    yPosition += invoice.invoice_line_items.length * 12 + 10;
  }

  // Table border
  doc.rect(20, tableStartY, 170, yPosition - tableStartY);

  // Totals section
  const totalsX = 120;
  yPosition += 10;

  // Subtotal
  addText('Subtotal:', totalsX, yPosition);
  addText(`$${invoice.subtotal.toFixed(2)}`, 180, yPosition, {
    align: 'right',
  });
  yPosition += 8;

  // Payments applied
  const totalPaid = (invoice.invoice_payments || []).reduce(
    (sum: number, payment: InvoicePayment) => sum + payment.amount,
    0
  );
  if (totalPaid > 0) {
    addText('Payments Applied:', totalsX, yPosition);
    addText(`-$${totalPaid.toFixed(2)}`, 180, yPosition, { align: 'right' });
    yPosition += 8;
  }

  // Balance due
  doc.setLineWidth(0.5);
  doc.line(totalsX, yPosition, 190, yPosition);
  yPosition += 5;

  addColoredText('BALANCE DUE:', totalsX, yPosition, primaryColor, 12);
  addColoredText(
    `$${invoice.balance_due.toFixed(2)}`,
    180,
    yPosition,
    primaryColor,
    12
  );

  yPosition += 20;

  // Invoice status
  const invoiceStatus = invoice.status;
  let statusText = '';
  let statusColor = textColor;

  switch (invoiceStatus) {
    case 'paid':
      statusText = 'PAID IN FULL';
      statusColor = [34, 197, 94]; // Green
      break;
    case 'partial':
      statusText = 'PARTIALLY PAID';
      statusColor = [251, 191, 36]; // Yellow
      break;
    case 'sent':
      statusText = 'PAYMENT DUE';
      statusColor = [239, 68, 68]; // Red
      break;
  }

  if (statusText) {
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(20, yPosition, 60, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(statusText, 50, yPosition + 8, { align: 'center' });
  }

  yPosition += 25;

  // Client notes
  if (invoice.client_notes) {
    addColoredText('NOTES:', 20, yPosition, secondaryColor, 10);
    yPosition += 8;
    addText(invoice.client_notes, 20, yPosition, { fontSize: 8 });
    yPosition += 15;
  }

  // Footer
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(8);
  addText('Thank you for your business!', 105, yPosition, { align: 'center' });
  yPosition += 8;
  addText('Payment terms: Net 30 days', 105, yPosition, { align: 'center' });
  yPosition += 8;
  addText(
    `Invoice generated on ${new Date().toLocaleDateString()}`,
    105,
    yPosition,
    { align: 'center' }
  );

  // Return PDF as buffer
  return Buffer.from(doc.output('arraybuffer'));
}
