import jsPDF from 'jspdf';
import { JobWithDetails } from '@/types/job';

interface InvoiceData {
  job: JobWithDetails;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
}

export async function generateInvoicePDF(
  invoiceData: InvoiceData
): Promise<Buffer> {
  const { job, companyInfo, invoiceNumber, invoiceDate } = invoiceData;

  // Create new PDF document
  const doc = new jsPDF();

  // Set up colors and fonts
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
  addColoredText(companyInfo.name, 70, yPosition + 5, primaryColor, 16);
  addText(companyInfo.address, 70, yPosition + 15);
  addText(`Phone: ${companyInfo.phone}`, 70, yPosition + 25);
  addText(`Email: ${companyInfo.email}`, 70, yPosition + 35);

  yPosition += 50;

  // Invoice header
  addColoredText('INVOICE', 20, yPosition, primaryColor, 20);
  yPosition += 15;

  // Invoice details
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);

  yPosition += 10;

  addText(`Invoice #: ${invoiceNumber}`, 20, yPosition);
  addText(`Date: ${invoiceDate}`, 140, yPosition);
  yPosition += 10;

  addText(`Job #: ${job.job_number}`, 20, yPosition);
  addText(`Service Date: ${job.service_date || 'TBD'}`, 140, yPosition);
  yPosition += 20;

  // Bill To section
  addColoredText('BILL TO:', 20, yPosition, secondaryColor, 12);
  yPosition += 10;

  const client = job.client;
  addText(`${client.first_name} ${client.last_name}`, 20, yPosition);
  if (client.company_name) {
    yPosition += 8;
    addText(client.company_name, 20, yPosition);
  }
  if (client.email) {
    yPosition += 8;
    addText(client.email, 20, yPosition);
  }
  if (client.phone) {
    yPosition += 8;
    addText(client.phone, 20, yPosition);
  }

  // Address
  let addressLines = [];
  if (client.address_line1) addressLines.push(client.address_line1);
  if (client.city || client.state || client.zip_code) {
    addressLines.push(
      [client.city, client.state, client.zip_code].filter(Boolean).join(', ')
    );
  }

  addressLines.forEach((line) => {
    yPosition += 8;
    addText(line, 20, yPosition);
  });

  yPosition += 20;

  // Job description
  if (job.title) {
    addColoredText('DESCRIPTION:', 20, yPosition, secondaryColor, 12);
    yPosition += 10;
    addText(job.title, 20, yPosition);
    yPosition += 10;
  }

  if (job.description) {
    addText(job.description, 20, yPosition, { fontSize: 9 });
    yPosition += 15;
  }

  // Line items table
  const tableStartY = yPosition;
  const colWidths = [80, 20, 30, 30]; // Description, Qty, Rate, Amount
  const colPositions = [20, 100, 140, 170];

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

  // Table rows
  if (job.line_items && job.line_items.length > 0) {
    job.line_items.forEach((item, index) => {
      const rowY = yPosition + index * 12;

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, rowY - 4, 170, 10, 'F');
      }

      addText(item.description, colPositions[0] + 2, rowY + 3, { fontSize: 9 });
      addText(item.quantity.toString(), colPositions[1] + 2, rowY + 3, {
        fontSize: 9,
      });
      addText(`$${item.unit_price.toFixed(2)}`, colPositions[2] + 2, rowY + 3, {
        fontSize: 9,
      });
      addText(`$${item.total.toFixed(2)}`, colPositions[3] + 2, rowY + 3, {
        fontSize: 9,
      });
    });

    yPosition += job.line_items.length * 12 + 10;
  } else {
    // No line items, show job total
    addText('Service Work', colPositions[0] + 2, yPosition + 3);
    addText('1', colPositions[1] + 2, yPosition + 3);
    addText(`$${job.total.toFixed(2)}`, colPositions[2] + 2, yPosition + 3);
    addText(`$${job.total.toFixed(2)}`, colPositions[3] + 2, yPosition + 3);
    yPosition += 20;
  }

  // Table border
  doc.rect(20, tableStartY, 170, yPosition - tableStartY);

  // Totals section
  const totalsX = 120;
  yPosition += 10;

  // Subtotal
  addText('Subtotal:', totalsX, yPosition);
  addText(`$${job.subtotal.toFixed(2)}`, 180, yPosition, { align: 'right' });
  yPosition += 8;

  // Tax
  if (job.tax > 0) {
    addText('Tax:', totalsX, yPosition);
    addText(`$${job.tax.toFixed(2)}`, 180, yPosition, { align: 'right' });
    yPosition += 8;
  }

  // Total
  doc.setLineWidth(0.5);
  doc.line(totalsX, yPosition, 190, yPosition);
  yPosition += 5;

  addColoredText('TOTAL:', totalsX, yPosition, primaryColor, 12);
  addColoredText(`$${job.total.toFixed(2)}`, 180, yPosition, primaryColor, 12);

  yPosition += 20;

  // Payment status
  const paymentStatus = job.payment_status;
  let statusText = '';
  let statusColor = textColor;

  switch (paymentStatus) {
    case 'paid':
      statusText = 'PAID IN FULL';
      statusColor = [34, 197, 94]; // Green
      break;
    case 'partial':
      statusText = 'PARTIAL PAYMENT';
      statusColor = [251, 191, 36]; // Yellow
      break;
    case 'unpaid':
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

  // Footer
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(8);
  addText('Thank you for your business!', 105, yPosition, { align: 'center' });
  yPosition += 8;
  addText('Please remit payment within 30 days.', 105, yPosition, {
    align: 'center',
  });
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
