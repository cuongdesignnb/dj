import 'server-only';

import { squareConfiguration } from './config';
import { getSquareClient, squareErrorCode, squareErrorMessage } from './client';

export type SquareLocationPreflight = {
  configured: boolean;
  ok: boolean;
  locationId: string | null;
  currency: string | null;
  status: string | null;
  capabilities: string[];
  errorCode?: string;
  message?: string;
};

export async function preflightSquareLocation(): Promise<SquareLocationPreflight> {
  const config = squareConfiguration();
  if (!config.token || !config.locationId) {
    return { configured: false, ok: false, locationId: config.locationId, currency: null, status: null, capabilities: [], errorCode: 'NOT_CONFIGURED' };
  }

  try {
    const response = await getSquareClient().locations.get({ locationId: config.locationId });
    const location = response.location;
    const capabilities = (location?.capabilities ?? []).map(String);
    const status = location?.status ? String(location.status) : null;
    const currency = location?.currency ? String(location.currency) : null;
    const ok = status === 'ACTIVE' && capabilities.includes('CREDIT_CARD_PROCESSING') && Boolean(currency);
    return {
      configured: true,
      ok,
      locationId: location?.id ?? config.locationId,
      currency,
      status,
      capabilities,
      ...(ok ? {} : { errorCode: 'LOCATION_NOT_READY', message: 'Square location is not active for card processing.' }),
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      locationId: config.locationId,
      currency: null,
      status: null,
      capabilities: [],
      errorCode: squareErrorCode(error),
      message: squareErrorMessage(error),
    };
  }
}
