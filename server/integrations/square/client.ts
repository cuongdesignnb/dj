import 'server-only';

import { SquareClient, SquareEnvironment } from 'square';
import { ApiError } from '@/server/errors';
import { squareConfiguration } from './config';

export function getSquareClient(): SquareClient {
  const config = squareConfiguration();
  if (!config.token) throw new ApiError(503, 'SQUARE_NOT_CONFIGURED', 'Square payments are not configured.');

  return new SquareClient({
    token: config.token,
    environment: config.environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    version: config.apiVersion,
    maxRetries: 2,
  });
}

export function squareErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 240);
  return 'Square returned an unexpected error.';
}

export function squareErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { errors?: Array<{ code?: string }> };
    const code = candidate.errors?.[0]?.code;
    if (typeof code === 'string') return code.slice(0, 80);
  }
  return 'SQUARE_ERROR';
}
