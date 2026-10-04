import 'server-only';
import { cache } from 'react';
import { getVipRepository } from './repository';
import type { VipPageState } from './types';

/** One normalization per SSR request, shared with metadata; fetch tags remain authoritative. */
export const loadVipPage = cache(async (): Promise<VipPageState> => {
  const repository = getVipRepository();
  const state: VipPageState = repository.ok ? await repository.repository.getVipPage()
    : { kind: 'service-unavailable', message: repository.error.message };
  if (state.kind !== 'ready') {
    const reason = {
      'vip-disabled': 'vip_disabled', 'booking-disabled': 'booking_disabled',
      'no-active-package': 'no_active_package', 'no-booths': 'no_booths', 'no-availability': 'no_availability',
      'not-configured': 'page_content_missing', 'invalid-response': 'invalid_payload', 'service-unavailable': 'network_failure',
    }[state.kind];
    console.info('[vip-page]', { reason });
  }
  return state;
});
