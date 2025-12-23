import jsPDF from 'jspdf';
import estimateDisclaimers from '../scripts/data/pricebook/estimate_disclaimers.json';

interface EstimatePdfOptions {
  estimateId: string;
}

export async function generateEstimatePdf(
  options: EstimatePdfOptions
): Promise<Buffer> {
  const { estimateId } = options;

  // Import here to avoid circular dependencies
  const { getEstimate } = await import('@/lib/db/estimates');
  const { getOrCreateBusinessSettings } =
    await import('@/lib/db/business-settings');

  const estimate = await getEstimate(estimateId);
  if (!estimate) {
    throw new Error('Estimate not found');
  }

  const businessSettings = await getOrCreateBusinessSettings();

  // Create new PDF document
  const doc = new jsPDF();

  // Set up colors and fonts (matching invoice styling)
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
    if (businessSettings.logo_url) {
      // Try to load and add the actual logo
      try {
        const img = new Image();
        img.src = businessSettings.logo_url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(reject, 3000); // 3 second timeout
        });
        doc.addImage(img, 'PNG', 20, yPosition, 40, 20);
      } catch (imgError) {
        // If image fails to load, use placeholder
        console.log('Logo image failed to load, using placeholder');
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(20, yPosition, 40, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        const initials = businessSettings.company_name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        doc.text(initials, 40, yPosition + 12, { align: 'center' });
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      }
    } else {
      // No logo URL, use company initials placeholder
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, yPosition, 40, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      const initials = businessSettings.company_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      doc.text(initials, 40, yPosition + 12, { align: 'center' });
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    }
  } catch (error) {
    console.log('Logo rendering failed, using text placeholder');
    addText(businessSettings.company_name.slice(0, 10), 40, yPosition + 12, {
      fontSize: 10,
      align: 'center',
    });
  }

  // Company info
  addColoredText(
    businessSettings.company_name,
    70,
    yPosition + 5,
    primaryColor,
    16
  );

  let companyY = yPosition + 15;
  if (businessSettings.company_address) {
    addText(businessSettings.company_address, 70, companyY);
    companyY += 10;
  }

  const cityStateZip = [
    businessSettings.company_city,
    businessSettings.company_state,
    businessSettings.company_zip,
  ]
    .filter(Boolean)
    .join(', ');
  if (cityStateZip) {
    addText(cityStateZip, 70, companyY);
    companyY += 10;
  }

  if (businessSettings.company_phone) {
    addText(`Phone: ${businessSettings.company_phone}`, 70, companyY);
    companyY += 10;
  }

  if (businessSettings.company_email) {
    addText(`Email: ${businessSettings.company_email}`, 70, companyY);
    companyY += 10;
  }

  if (businessSettings.company_website) {
    addText(`Website: ${businessSettings.company_website}`, 70, companyY);
  }

  yPosition += 60;

  // Estimate header
  addColoredText('ESTIMATE', 20, yPosition, primaryColor, 20);
  yPosition += 15;

  // Estimate details
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);

  yPosition += 10;

  addText(`Estimate #: ${estimate.estimate_number}`, 20, yPosition);
  addText(
    `Date: ${new Date(estimate.created_at).toLocaleDateString()}`,
    140,
    yPosition
  );
  yPosition += 10;

  if (estimate.valid_until) {
    addText(
      `Valid Until: ${new Date(estimate.valid_until).toLocaleDateString()}`,
      20,
      yPosition
    );
    yPosition += 10;
  }

  yPosition += 10;

  // Bill To section
  addColoredText('FOR:', 20, yPosition, secondaryColor, 12);
  yPosition += 10;

  const client = estimate.client;
  if (client) {
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

    // Address - client object from estimate doesn't include full address
    // Address would come from properties table if needed
  }

  yPosition += 20;

  // Estimate description
  if (estimate.title) {
    addColoredText('DESCRIPTION:', 20, yPosition, secondaryColor, 12);
    yPosition += 10;
    addText(estimate.title, 20, yPosition);
    yPosition += 10;
  }

  if (estimate.description) {
    addText(estimate.description, 20, yPosition, { fontSize: 9 });
    yPosition += 15;
  }

  // Line items table
  const tableStartY = yPosition;
  const colWidths = [25, 65, 20, 25, 35]; // Code, Description, Qty, Tier, Amount
  const colPositions = [20, 45, 110, 130, 155];

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition, 170, 10, 'F');

  addColoredText('CODE', colPositions[0] + 2, yPosition + 7, textColor, 9);
  addColoredText(
    'DESCRIPTION',
    colPositions[1] + 2,
    yPosition + 7,
    textColor,
    9
  );
  addColoredText('QTY', colPositions[2] + 2, yPosition + 7, textColor, 9);
  addColoredText('TIER', colPositions[3] + 2, yPosition + 7, textColor, 9);
  addColoredText('AMOUNT', colPositions[4] + 2, yPosition + 7, textColor, 9);

  yPosition += 15;

  // Table rows
  if (estimate.line_items && estimate.line_items.length > 0) {
    estimate.line_items.forEach((item, index) => {
      const rowY = yPosition + index * 12;

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, rowY - 4, 170, 10, 'F');
      }

      // Get tier display
      const tierDisplay = item.tier
        ? item.tier.charAt(0).toUpperCase() + item.tier.slice(1)
        : 'Standard';

      addText(item.code || '', colPositions[0] + 2, rowY + 3, { fontSize: 8 });
      addText(item.description, colPositions[1] + 2, rowY + 3, { fontSize: 8 });
      addText(item.quantity.toString(), colPositions[2] + 2, rowY + 3, {
        fontSize: 8,
      });
      addText(tierDisplay, colPositions[3] + 2, rowY + 3, { fontSize: 8 });
      addText(
        `$${item.total?.toFixed(2) || '0.00'}`,
        colPositions[4] + 2,
        rowY + 3,
        { fontSize: 8 }
      );
    });

    yPosition += estimate.line_items.length * 12 + 10;
  }

  // Table border
  doc.rect(20, tableStartY, 170, yPosition - tableStartY);

  // Totals section
  const totalsX = 120;
  yPosition += 10;

  // Subtotal
  addText('Subtotal:', totalsX, yPosition);
  addText(`$${estimate.subtotal?.toFixed(2) || '0.00'}`, 180, yPosition, {
    align: 'right',
  });
  yPosition += 8;

  // Tax (if any)
  if (estimate.tax_amount && estimate.tax_amount > 0) {
    addText('Tax:', totalsX, yPosition);
    addText(`$${estimate.tax_amount.toFixed(2)}`, 180, yPosition, {
      align: 'right',
    });
    yPosition += 8;
  }

  // Adjusted total (if different from subtotal + tax)
  const calculatedTotal = (estimate.subtotal || 0) + (estimate.tax_amount || 0);
  if (estimate.total !== calculatedTotal) {
    addText('Adjusted Total:', totalsX, yPosition);
    addText(`$${estimate.total.toFixed(2)}`, 180, yPosition, {
      align: 'right',
    });
    yPosition += 8;

    // Note about minimum
    addText('(Minimum job total applied)', totalsX, yPosition, { fontSize: 8 });
    yPosition += 8;
  }

  // Total
  doc.setLineWidth(0.5);
  doc.line(totalsX, yPosition, 190, yPosition);
  yPosition += 5;

  addColoredText('TOTAL:', totalsX, yPosition, primaryColor, 12);
  addColoredText(
    `$${estimate.total.toFixed(2)}`,
    180,
    yPosition,
    primaryColor,
    12
  );

  yPosition += 20;

  // Estimate status
  const status = estimate.status;
  let statusText = '';
  let statusColor = textColor;

  switch (status) {
    case 'sent':
      statusText = 'ESTIMATE SENT';
      statusColor = [59, 130, 246]; // Blue
      break;
    case 'approved':
      statusText = 'APPROVED';
      statusColor = [34, 197, 94]; // Green
      break;
    case 'declined':
      statusText = 'DECLINED';
      statusColor = [239, 68, 68]; // Red
      break;
    case 'expired':
      statusText = 'EXPIRED';
      statusColor = [156, 163, 175]; // Gray
      break;
    default:
      statusText = 'DRAFT';
      statusColor = [156, 163, 175]; // Gray
  }

  if (statusText) {
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(20, yPosition, 60, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(statusText, 50, yPosition + 8, { align: 'center' });
  }

  yPosition += 25;

  // Disclaimers section
  addColoredText('TERMS & CONDITIONS:', 20, yPosition, secondaryColor, 12);
  yPosition += 10;

  estimateDisclaimers.lines.forEach((line) => {
    addText(line, 20, yPosition, { fontSize: 7 });
    yPosition += 6;
  });

  // Add validity date if estimate has created_at
  if (estimate.created_at) {
    const validUntil = new Date(estimate.created_at);
    validUntil.setDate(
      validUntil.getDate() + estimateDisclaimers.validity_days
    );
    yPosition += 4;
    addText(
      `This estimate is valid until: ${validUntil.toLocaleDateString()}`,
      20,
      yPosition,
      { fontSize: 7 }
    );
    yPosition += 10;
  } else {
    yPosition += 10;
  }

  // Footer
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(8);

  // Split terms into lines and add them
  const termsLines = businessSettings.default_estimate_terms.split('\n');
  termsLines.forEach((line) => {
    addText(line, 105, yPosition, { align: 'center' });
    yPosition += 8;
  });

  yPosition += 4;
  addText(
    `Estimate generated on ${new Date().toLocaleDateString()}`,
    105,
    yPosition,
    { align: 'center' }
  );

  // Return PDF as buffer
  return Buffer.from(doc.output('arraybuffer'));
}
