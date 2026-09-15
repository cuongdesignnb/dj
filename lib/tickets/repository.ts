// Data access for /tickets.
//
//   MockTicketsRepository  — local content, the default
//   HttpTicketsRepository  — GET {base}/api/v1/pages/tickets
//
// Selected by NEXT_PUBLIC_DATA_SOURCE / NEXT_PUBLIC_API_BASE_URL, the same
// switches the events listings use.

import type { TicketsPageData } from './types';
import { TICKETS_MOCK } from './mock';
import { normalizeTicketsPage } from './http';

export interface TicketsRepositoryError {
  kind: 'network' | 'http' | 'invalid' | 'config';
  message: string;
}

export type TicketsRepositoryResult =
  | { ok: true; data: TicketsPageData }
  | { ok: false; error: TicketsRepositoryError };

export interface TicketsRepository {
  getTicketsPage(): Promise<TicketsRepositoryResult>;
}

export class MockTicketsRepository implements TicketsRepository {
  async getTicketsPage(): Promise<TicketsRepositoryResult> {
    return { ok: true, data: TICKETS_MOCK };
  }
}

export class HttpTicketsRepository implements TicketsRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly revalidateSeconds = 120,
  ) {}

  async getTicketsPage(): Promise<TicketsRepositoryResult> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/pages/tickets`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: 'application/json' },
        next: { revalidate: this.revalidateSeconds },
      });
    } catch {
      return {
        ok: false,
        error: {
          kind: 'network',
          message: 'Could not reach the ticketing service. Please try again shortly.',
        },
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          kind: 'http',
          message: `The ticketing service returned ${response.status}. Please try again shortly.`,
        },
      };
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The ticketing service returned an invalid response.' },
      };
    }

    const data = normalizeTicketsPage(raw);
    if (!data) {
      return {
        ok: false,
        error: {
          kind: 'invalid',
          message: 'The ticketing service returned data this page cannot display.',
        },
      };
    }

    return { ok: true, data };
  }
}

export interface TicketsDataEnv {
  source: 'mock' | 'api';
  baseUrl: string;
}

export function readTicketsEnv(): TicketsDataEnv {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  return {
    source: source === 'api' || source === 'http' ? 'api' : 'mock',
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim(),
  };
}

/**
 * Returns the configured repository, or a config error when the site asks for
 * the API without giving it an address — a visible misconfiguration beats a
 * production page quietly serving local prices.
 */
export function getTicketsRepository():
  | { ok: true; repository: TicketsRepository }
  | { ok: false; error: TicketsRepositoryError } {
  const env = readTicketsEnv();

  if (env.source === 'api') {
    if (!env.baseUrl) {
      return {
        ok: false,
        error: {
          kind: 'config',
          message:
            'NEXT_PUBLIC_DATA_SOURCE=api requires NEXT_PUBLIC_API_BASE_URL to be configured.',
        },
      };
    }
    return { ok: true, repository: new HttpTicketsRepository(env.baseUrl) };
  }

  return { ok: true, repository: new MockTicketsRepository() };
}
