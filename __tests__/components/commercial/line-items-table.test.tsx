import { render, screen } from '@testing-library/react';
import {
  LineItemsTable,
  LineItemsTotals,
} from '@/components/commercial/line-items-table';

describe('LineItemsTable', () => {
  const mockItems = [
    {
      id: '1',
      description: 'Service A',
      quantity: 2,
      unit_price: 100,
      total: 200,
    },
    {
      id: '2',
      description: 'Service B',
      quantity: 1,
      unit_price: 150,
      total: 150,
      tier: 'Premium',
    },
    {
      id: '3',
      description: 'Service C',
      quantity: 3,
      unit_price: 50,
      total: 150,
      code: 'SVC-003',
    },
  ];

  it('renders table headers', () => {
    render(<LineItemsTable items={mockItems} />);

    expect(screen.getByText('Description')).toBeTruthy();
    expect(screen.getByText('Qty')).toBeTruthy();
    expect(screen.getByText('Rate')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
  });

  it('renders all line items', () => {
    render(<LineItemsTable items={mockItems} />);

    expect(screen.getByText('Service A')).toBeTruthy();
    expect(screen.getByText('Service B')).toBeTruthy();
    expect(screen.getByText('Service C')).toBeTruthy();
  });

  it('displays tier information when present', () => {
    render(<LineItemsTable items={mockItems} />);

    expect(screen.getByText('Premium')).toBeTruthy();
  });

  it('displays code information when present', () => {
    render(<LineItemsTable items={mockItems} />);

    expect(screen.getByText('SVC-003')).toBeTruthy();
  });

  it('renders empty state when no items', () => {
    render(<LineItemsTable items={[]} />);

    expect(screen.getByText('No line items')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LineItemsTable items={mockItems} className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeTruthy();
  });
});

describe('LineItemsTotals', () => {
  it('renders subtotal and total', () => {
    render(<LineItemsTotals subtotal={350} total={350} />);

    expect(screen.getByText('Subtotal')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
  });

  it('renders tax amount when provided', () => {
    render(<LineItemsTotals subtotal={350} taxAmount={28} total={378} />);

    expect(screen.getByText(/Tax/)).toBeTruthy();
  });

  it('renders tax rate when provided', () => {
    render(
      <LineItemsTotals subtotal={350} taxAmount={28} taxRate={8} total={378} />
    );

    expect(screen.getByText(/Tax.*8%/)).toBeTruthy();
  });

  it('renders discount section when provided', () => {
    const { container } = render(
      <LineItemsTotals subtotal={350} discountAmount={35} total={315} />
    );

    expect(container.querySelector('.text-green-600')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LineItemsTotals subtotal={350} total={350} className="mt-8" />
    );

    expect(container.querySelector('.mt-8')).toBeTruthy();
  });
});
