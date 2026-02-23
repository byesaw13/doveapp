import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentPanel } from '@/components/commercial/payment-panel';
import type { InvoicePayment } from '@/types/invoice';

const mockPayments: InvoicePayment[] = [
  {
    id: 'pay-1',
    invoice_id: 'inv-1',
    amount: 100,
    method: 'cash',
    paid_at: '2024-01-15T10:00:00Z',
    reference: 'Cash payment',
    created_at: '2024-01-15T10:00:00Z',
  },
];

describe('PaymentPanel', () => {
  const mockOnRecordPayment = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders balance due section', () => {
    render(
      <PaymentPanel
        balanceDue={150}
        payments={[]}
        onRecordPayment={mockOnRecordPayment}
      />
    );

    expect(screen.getByText('Payments')).toBeTruthy();
    expect(screen.getByText('Balance')).toBeTruthy();
  });

  it('shows "Paid in Full" when balance is zero', () => {
    render(
      <PaymentPanel
        balanceDue={0}
        payments={mockPayments}
        onRecordPayment={mockOnRecordPayment}
      />
    );

    expect(screen.getByText('Paid in Full')).toBeTruthy();
  });

  it('displays payment history section when payments exist', () => {
    render(
      <PaymentPanel
        balanceDue={50}
        payments={mockPayments}
        onRecordPayment={mockOnRecordPayment}
      />
    );

    expect(screen.getByText('Payment History')).toBeTruthy();
  });

  it('shows "Record Payment" button when balance is due', () => {
    render(
      <PaymentPanel
        balanceDue={150}
        payments={[]}
        onRecordPayment={mockOnRecordPayment}
      />
    );

    expect(screen.getByText('Record Payment')).toBeTruthy();
  });

  it('hides "Record Payment" button when paid in full', () => {
    render(
      <PaymentPanel
        balanceDue={0}
        payments={mockPayments}
        onRecordPayment={mockOnRecordPayment}
      />
    );

    const recordButton = screen.queryByRole('button', {
      name: /record payment/i,
    });
    expect(recordButton).toBeNull();
  });

  it('shows payment form when "Record Payment" is clicked', () => {
    render(
      <PaymentPanel
        balanceDue={150}
        payments={[]}
        onRecordPayment={mockOnRecordPayment}
      />
    );

    fireEvent.click(screen.getByText('Record Payment'));

    expect(screen.getByLabelText(/amount/i)).toBeTruthy();
  });

  it('shows max amount hint', () => {
    render(
      <PaymentPanel
        balanceDue={150}
        payments={[]}
        onRecordPayment={mockOnRecordPayment}
      />
    );

    fireEvent.click(screen.getByText('Record Payment'));

    expect(screen.getByText(/max/i)).toBeTruthy();
  });

  it('shows cancel button in form', () => {
    render(
      <PaymentPanel
        balanceDue={150}
        payments={[]}
        onRecordPayment={mockOnRecordPayment}
      />
    );

    fireEvent.click(screen.getByText('Record Payment'));

    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
  });
});
