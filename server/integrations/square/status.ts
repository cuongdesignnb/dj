export function squarePaymentStatus(value: unknown): 'PENDING' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
  const status = String(value ?? '').toUpperCase();
  if (status === 'APPROVED') return 'APPROVED';
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'FAILED') return 'FAILED';
  if (status === 'CANCELED' || status === 'CANCELLED') return 'CANCELLED';
  return 'PENDING';
}
