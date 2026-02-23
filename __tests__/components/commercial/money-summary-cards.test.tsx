import { render, screen } from '@testing-library/react';
import {
  MoneySummaryCards,
  EstimateSummaryCards,
  InvoiceSummaryCards,
} from '@/components/commercial/money-summary-cards';
import { FileText, DollarSign } from 'lucide-react';

describe('MoneySummaryCards', () => {
  const mockCards = [
    { title: 'Total', value: 1000, icon: <FileText className="h-5 w-5" /> },
    {
      title: 'Revenue',
      value: '$5,000',
      icon: <DollarSign className="h-5 w-5" />,
    },
    { title: 'Pending', value: 5, variant: 'warning' as const },
    { title: 'Complete', value: 10, variant: 'success' as const },
  ];

  it('renders all cards with titles and values', () => {
    render(<MoneySummaryCards cards={mockCards} />);

    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Complete')).toBeTruthy();
  });

  it('formats numeric values as currency', () => {
    render(<MoneySummaryCards cards={[{ title: 'Amount', value: 1234.56 }]} />);

    expect(screen.getByText('$1,234.56')).toBeTruthy();
  });

  it('renders subtitles when provided', () => {
    render(
      <MoneySummaryCards
        cards={[{ title: 'Revenue', value: 5000, subtitle: 'This month' }]}
      />
    );

    expect(screen.getByText('This month')).toBeTruthy();
  });

  it('applies variant styles correctly', () => {
    const { container } = render(
      <MoneySummaryCards
        cards={[
          { title: 'Success', value: 1, variant: 'success' },
          { title: 'Warning', value: 2, variant: 'warning' },
          { title: 'Danger', value: 3, variant: 'danger' },
        ]}
      />
    );

    expect(container.querySelector('.bg-emerald-50')).toBeTruthy();
    expect(container.querySelector('.bg-amber-50')).toBeTruthy();
    expect(container.querySelector('.bg-red-50')).toBeTruthy();
  });

  it('renders with 2 columns layout', () => {
    const { container } = render(
      <MoneySummaryCards cards={mockCards} columns={2} />
    );

    expect(container.querySelector('.sm\\:grid-cols-2')).toBeTruthy();
  });

  it('renders with 3 columns layout', () => {
    const { container } = render(
      <MoneySummaryCards cards={mockCards} columns={3} />
    );

    expect(container.querySelector('.lg\\:grid-cols-3')).toBeTruthy();
  });
});

describe('EstimateSummaryCards', () => {
  it('renders estimate statistics', () => {
    render(
      <EstimateSummaryCards
        stats={{
          total_estimates: 25,
          draft_estimates: 5,
          sent_estimates: 10,
          accepted_estimates: 8,
          total_value: 15000,
          accepted_value: 8000,
        }}
      />
    );

    expect(screen.getByText('Total Estimates')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Accepted')).toBeTruthy();
    expect(screen.getByText('Total Value')).toBeTruthy();
  });

  it('handles missing stats gracefully', () => {
    render(<EstimateSummaryCards stats={{}} />);

    expect(screen.getByText('Total Estimates')).toBeTruthy();
  });
});

describe('InvoiceSummaryCards', () => {
  it('renders invoice statistics', () => {
    render(
      <InvoiceSummaryCards
        stats={{
          total_invoices: 30,
          paid_invoices: 20,
          total_revenue: 25000,
          outstanding_balance: 5000,
          overdue_count: 3,
        }}
      />
    );

    expect(screen.getByText('Total Invoices')).toBeTruthy();
    expect(screen.getByText('Paid')).toBeTruthy();
    expect(screen.getByText('Outstanding')).toBeTruthy();
    expect(screen.getByText('Revenue')).toBeTruthy();
  });

  it('handles missing stats gracefully', () => {
    render(<InvoiceSummaryCards stats={{}} />);

    expect(screen.getByText('Total Invoices')).toBeTruthy();
  });

  it('shows overdue count when provided', () => {
    render(
      <InvoiceSummaryCards
        stats={{
          total_invoices: 30,
          overdue_count: 5,
        }}
      />
    );

    expect(screen.getByText('5 overdue')).toBeTruthy();
  });
});
