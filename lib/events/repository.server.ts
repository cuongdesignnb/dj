import 'server-only';
import { FIXTURE_BY_SLUG } from './fixture';
import { validateEventPageData } from './validation';
import type {
  EventPageData,
  EventRepository,
  RepositoryError,
} from './types';

type Source = 'mock' | 'http';

export type RepositoryResult =
  | { ok: true; data: EventPageData }
  | { ok: false; error: RepositoryError };

const DEFAULT_TIMEOUT_MS = 8000;

function readSourceConfig(): Source {
  const raw = (process.env.EVENT_DATA_SOURCE ?? 'mock').toLowerCase();
  if (raw === 'http') return 'http';
  if (raw === 'mock') return 'mock';
  // Misconfiguration must surface, not silently fall back.
  throw new Error(
    `Invalid EVENT_DATA_SOURCE="${raw}". Expected "mock" or "http".`,
  );
}

function readBaseUrl(): string | null {
  const raw = process.env.EVENT_API_BASE_URL;
  if (!raw || raw.trim() === '') return null;
  return raw.trim().replace(/\/$/, '');
}

function readDefaultSlug(): string {
  return (process.env.EVENT_SLUG ?? 'destiny').trim() || 'destiny';
}

export function readEventEnv() {
  return {
    source: readSourceConfig(),
    baseUrl: readBaseUrl(),
    defaultSlug: readDefaultSlug(),
    siteUrl: process.env.SITE_URL ?? null,
  };
}

// Mock adapter — deterministic, no IO. Always available and validated through
// the same validator that HTTP responses go through.
async function getPageMock(
  slug: string,
  signal?: AbortSignal,
): Promise<RepositoryResult> {
  if (signal?.aborted) {
    return { ok: false, error: { kind: 'network-error', message: 'aborted' } };
  }
  const data = FIXTURE_BY_SLUG[slug];
  if (!data) {
    return {
      ok: false,
      error: { kind: 'not-found', message: `No mock fixture for slug "${slug}"` },
    };
  }
  const validated = validateEventPageData(data);
  if (!validated.ok) {
    return {
      ok: false,
      error: {
        kind: 'invalid-payload',
        message: 'Mock fixture failed validation',
      },
    };
  }
  return { ok: true, data: validated.data };
}

// HTTP adapter — calls the configured endpoint and validates the response.
// Intentionally conservative: no silent fallback to mock data on error, since
// the task spec demands HTTP-mode failures to remain HTTP-mode failures.
async function getPageHttp(
  slug: string,
  baseUrl: string,
  signal?: AbortSignal,
): Promise<RepositoryResult> {
  const url = `${baseUrl}/public/events/${encodeURIComponent(slug)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const combinedSignal = signal
    ? anySignal([signal, controller.signal])
    : controller.signal;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: combinedSignal,
      cache: 'no-store',
    });

    if (res.status === 404) {
      return {
        ok: false,
        error: { kind: 'not-found', status: 404, message: 'Event not found' },
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: {
          kind: 'http-error',
          status: res.status,
          message: `Upstream returned ${res.status}`,
        },
      };
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid-payload', message: 'Response is not valid JSON' },
      };
    }

    // Accept either bare EventPageData or { data: EventPageData }
    const candidate =
      isPlainObject(json) && 'data' in json && isPlainObject((json as { data: unknown }).data)
        ? (json as { data: unknown }).data
        : json;

    const validated = validateEventPageData(candidate);
    if (!validated.ok) {
      return {
        ok: false,
        error: {
          kind: 'invalid-payload',
          message: `Schema validation failed (${validated.errors.slice(0, 3).join('; ')})`,
        },
      };
    }
    return { ok: true, data: validated.data };
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      return {
        ok: false,
        error: { kind: 'network-error', message: 'Request aborted or timed out' },
      };
    }
    return {
      ok: false,
      error: {
        kind: 'network-error',
        message: err instanceof Error ? err.message : 'Unknown fetch error',
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort();
      break;
    }
    s.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  return ctrl.signal;
}

class HttpRepository implements EventRepository {
  constructor(private baseUrl: string) {}

  getPage(slug: string, options?: { signal?: AbortSignal }) {
    return getPageHttp(slug, this.baseUrl, options?.signal);
  }
}

class MockRepository implements EventRepository {
  getPage(slug: string, options?: { signal?: AbortSignal }) {
    return getPageMock(slug, options?.signal);
  }
}

let cached: EventRepository | null = null;
let cachedSource: Source | null = null;
let cachedBaseUrl: string | null = null;

export function getEventRepository(): EventRepository {
  const env = readEventEnv();
  if (
    cached &&
    cachedSource === env.source &&
    cachedBaseUrl === env.baseUrl
  ) {
    return cached;
  }
  if (env.source === 'http') {
    if (!env.baseUrl) {
      throw new Error(
        'EVENT_DATA_SOURCE=http requires EVENT_API_BASE_URL to be set.',
      );
    }
    cached = new HttpRepository(env.baseUrl);
  } else {
    cached = new MockRepository();
  }
  cachedSource = env.source;
  cachedBaseUrl = env.baseUrl;
  return cached;
}

export function getDefaultEventSlug(): string {
  return readDefaultSlug();
}

export { getPageMock as _getPageMock, getPageHttp as _getPageHttp };
