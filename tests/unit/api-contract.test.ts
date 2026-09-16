import { describe, expect, it } from 'vitest';
import { checkoutSchema, eventMutationSchema, loginSchema } from '@/server/validators/api';

describe('API validation contracts', () => {
  it('accepts storefront lines and normalizes them to checkout items', () => {
    const result = checkoutSchema.safeParse({
      lines: [{ productId: '51b891f9-b621-41e0-9c85-0bced27309ca', quantity: 2 }],
      clientReference: 'browser-ref-123456',
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.items).toHaveLength(1);
  });

  it('rejects checkout requests without a line', () => {
    expect(checkoutSchema.safeParse({ clientReference: 'browser-ref-123456' }).success).toBe(false);
  });

  it('requires the event translation and venue fields for admin writes', () => {
    const result = eventMutationSchema.safeParse({ slug: 'destiny', translations: [] });
    expect(result.success).toBe(false);
  });

  it('normalizes admin email input before authentication', () => {
    const result = loginSchema.safeParse({ email: ' ADMIN@EXAMPLE.COM ', password: 'secret' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('admin@example.com');
  });
});
