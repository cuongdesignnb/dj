import { describe, expect, it } from 'vitest';
import { estimatedTotal, subtotal } from '@/lib/cart/pricing';

describe('cart money calculations', () => {
  it('keeps all arithmetic in minor units', () => {
    const total = subtotal([
      { unitPrice: { amountMinor: 6500, currency: 'AUD' }, quantity: 2 },
      { unitPrice: { amountMinor: 2500, currency: 'AUD' }, quantity: 1 },
    ]);
    expect(total).toEqual({ amountMinor: 15500, currency: 'AUD' });
  });

  it('never lets a discount make the total negative', () => {
    expect(estimatedTotal({ amountMinor: 1000, currency: 'AUD' }, { amountMinor: 1500, currency: 'AUD' })).toEqual({ amountMinor: 0, currency: 'AUD' });
  });
});
