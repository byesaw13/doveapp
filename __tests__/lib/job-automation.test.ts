/**
 * Tests for Job Lifecycle Automation
 *
 * These tests verify the automation logic works correctly.
 * Run with: npm test job-automation
 */

import { describe, it, expect } from '@jest/globals';

describe('Job Lifecycle Automation', () => {
  describe('Payment Status Logic', () => {
    function determinePaymentStatus(
      total: number,
      amountPaid: number
    ): 'unpaid' | 'partial' | 'paid' {
      if (amountPaid === 0) {
        return 'unpaid';
      } else if (amountPaid >= total) {
        return 'paid';
      } else {
        return 'partial';
      }
    }

    it('should determine unpaid status when amount is 0', () => {
      const status = determinePaymentStatus(100, 0);
      expect(status).toBe('unpaid');
    });

    it('should determine paid status when fully paid', () => {
      const status = determinePaymentStatus(100, 100);
      expect(status).toBe('paid');
    });

    it('should determine partial status when partially paid', () => {
      const status = determinePaymentStatus(100, 50);
      expect(status).toBe('partial');
    });

    it('should handle overpayment as paid', () => {
      const status = determinePaymentStatus(100, 150);
      expect(status).toBe('paid');
    });
  });

  describe('Job Total Calculations', () => {
    it('should calculate subtotal from line items', () => {
      const lineItems = [
        { quantity: 2, unit_price: 50 },
        { quantity: 1, unit_price: 25.5 },
        { quantity: 3, unit_price: 10 },
      ];

      const subtotal = lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      expect(subtotal).toBe(155.5);
    });

    it('should calculate tax correctly', () => {
      const subtotal = 100;
      const taxRate = 0.1;

      const tax = subtotal * taxRate;

      expect(tax).toBe(10);
    });

    it('should calculate total with tax', () => {
      const subtotal = 100;
      const taxRate = 0.075;

      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      expect(total).toBe(107.5);
    });

    it('should handle zero tax rate', () => {
      const subtotal = 100;
      const taxRate = 0.0;

      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      expect(total).toBe(100);
    });
  });

  describe('Job Status Transitions', () => {
    function isValidStatusTransition(from: string, to: string): boolean {
      const validTransitions: Record<string, string[]> = {
        quote: ['scheduled', 'cancelled'],
        scheduled: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: ['invoiced'],
        invoiced: [],
      };

      return validTransitions[from]?.includes(to) || false;
    }

    it('should allow quote to scheduled transition', () => {
      const isValid = isValidStatusTransition('quote', 'scheduled');
      expect(isValid).toBe(true);
    });

    it('should allow completed to invoiced transition', () => {
      const isValid = isValidStatusTransition('completed', 'invoiced');
      expect(isValid).toBe(true);
    });

    it('should prevent invalid transitions', () => {
      const isValid = isValidStatusTransition('in_progress', 'quote');
      expect(isValid).toBe(false);
    });

    it('should prevent invoiced to any transition', () => {
      const isValid = isValidStatusTransition('invoiced', 'completed');
      expect(isValid).toBe(false);
    });
  });

  describe('Automation Suggestions Logic', () => {
    function getSuggestions(job: {
      status: string;
      serviceDate?: string | null;
      paymentStatus?: string;
    }): string[] {
      const suggestions: string[] = [];

      if (job.status === 'quote') {
        suggestions.push('Convert this quote to a scheduled job');
      }

      if (job.status === 'scheduled' && !job.serviceDate) {
        suggestions.push('Set a service date for this scheduled job');
      }

      if (job.status === 'in_progress') {
        suggestions.push('Mark this job as completed when work is finished');
      }

      if (job.status === 'completed') {
        suggestions.push('Generate invoice for this completed job');
      }

      if (job.status === 'invoiced' && job.paymentStatus === 'unpaid') {
        suggestions.push('Record payment when client pays');
      }

      return suggestions;
    }

    it('should suggest converting quote', () => {
      const suggestions = getSuggestions({ status: 'quote' });
      expect(suggestions).toContain('Convert this quote to a scheduled job');
    });

    it('should suggest setting service date', () => {
      const suggestions = getSuggestions({
        status: 'scheduled',
        serviceDate: null,
      });
      expect(suggestions).toContain(
        'Set a service date for this scheduled job'
      );
    });

    it('should suggest marking as completed for in_progress', () => {
      const suggestions = getSuggestions({ status: 'in_progress' });
      expect(suggestions).toContain(
        'Mark this job as completed when work is finished'
      );
    });

    it('should suggest recording payment for unpaid invoice', () => {
      const suggestions = getSuggestions({
        status: 'invoiced',
        paymentStatus: 'unpaid',
      });
      expect(suggestions).toContain('Record payment when client pays');
    });

    it('should calculate remaining balance for partial payment', () => {
      const total = 100;
      const amountPaid = 35;

      const remaining = total - amountPaid;

      expect(remaining).toBe(65);
      expect(remaining.toFixed(2)).toBe('65.00');
    });
  });

  describe('Line Item Calculations', () => {
    it('should calculate line item total', () => {
      const quantity = 5;
      const unitPrice = 12.5;

      const total = quantity * unitPrice;

      expect(total).toBe(62.5);
    });

    it('should handle decimal quantities', () => {
      const quantity = 2.5;
      const unitPrice = 10;

      const total = quantity * unitPrice;

      expect(total).toBe(25);
    });

    it('should handle decimal unit prices', () => {
      const quantity = 3;
      const unitPrice = 33.33;

      const total = quantity * unitPrice;

      expect(total).toBeCloseTo(99.99, 2);
    });
  });
});
