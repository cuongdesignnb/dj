import { getApiBaseUrl, getCheckoutMode } from './config';
import { HttpCheckoutRepository } from './http';
import type { CheckoutRepository, CheckoutResult } from './types';

/** With checkout disabled there are no orders to find. */
class DisabledCheckoutRepository implements CheckoutRepository {
  async getResultBySessionId(): Promise<CheckoutResult> {
    return { status: 'not-found' };
  }
}

export function getCheckoutRepository(): CheckoutRepository {
  return getCheckoutMode() === 'live'
    ? new HttpCheckoutRepository(getApiBaseUrl())
    : new DisabledCheckoutRepository();
}
