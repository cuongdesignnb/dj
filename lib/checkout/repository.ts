import { getApiBaseUrl, getCheckoutMode } from './config';
import { HttpCheckoutRepository } from './http';
import { MockCheckoutRepository } from './mock';
import type { CheckoutRepository, CheckoutResult } from './types';

/** With checkout disabled there are no orders to find. */
class DisabledCheckoutRepository implements CheckoutRepository {
  async getResultBySessionId(): Promise<CheckoutResult> {
    return { status: 'not-found' };
  }
}

export function getCheckoutRepository(): CheckoutRepository {
  switch (getCheckoutMode()) {
    case 'live':
      return new HttpCheckoutRepository(getApiBaseUrl());
    case 'mock':
      return new MockCheckoutRepository();
    default:
      return new DisabledCheckoutRepository();
  }
}
