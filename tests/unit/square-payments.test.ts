import { describe, expect, it } from 'vitest';
import { squarePaymentStatus } from '@/server/integrations/square/status';

describe('Square payment status mapping', () => {
  it('keeps provider terminal states explicit', () => {
    expect(squarePaymentStatus('COMPLETED')).toBe('COMPLETED');
    expect(squarePaymentStatus('FAILED')).toBe('FAILED');
    expect(squarePaymentStatus('CANCELED')).toBe('CANCELLED');
  });

  it('does not treat unknown or absent states as paid', () => {
    expect(squarePaymentStatus('APPROVED')).toBe('APPROVED');
    expect(squarePaymentStatus('PENDING')).toBe('PENDING');
    expect(squarePaymentStatus('')).toBe('PENDING');
    expect(squarePaymentStatus(undefined)).not.toBe('COMPLETED');
  });
});
