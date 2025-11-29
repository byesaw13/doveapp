/**
 * Basic tests for client CRUD operations
 * Note: These are placeholder tests. For full testing, you'd need to mock Supabase.
 */

import { clientSchema } from '@/lib/validations/client';

describe('Client Validation', () => {
  it('should validate a valid client', () => {
    const validClient = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
    };

    const result = clientSchema.safeParse(validClient);
    expect(result.success).toBe(true);
  });

  it('should reject client without first name', () => {
    const invalidClient = {
      first_name: '',
      last_name: 'Doe',
    };

    const result = clientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
  });

  it('should reject client with invalid email', () => {
    const invalidClient = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'not-an-email',
    };

    const result = clientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
  });

  it('should accept client with optional fields empty', () => {
    const validClient = {
      first_name: 'John',
      last_name: 'Doe',
      company_name: '',
      email: '',
      phone: '',
    };

    const result = clientSchema.safeParse(validClient);
    expect(result.success).toBe(true);
  });
});
