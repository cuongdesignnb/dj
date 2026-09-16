import 'server-only';
import Redis from 'ioredis';
import { runtimeConfig, isProduction } from '@/server/config';
import { ApiError } from '@/server/errors';

const memory = new Map<string, { count: number; resetAt: number }>();
let redis: Redis | null | undefined;

function client() {
  if (redis !== undefined) return redis;
  const url = runtimeConfig().redisUrl;
  redis = url ? new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 }) : null;
  return redis;
}

export async function enforceRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const redisClient = client();
  if (redisClient) {
    try {
      if (redisClient.status === 'wait') await redisClient.connect();
      const bucket = `rate:${key}`;
      const count = await redisClient.incr(bucket);
      if (count === 1) await redisClient.expire(bucket, windowSeconds);
      if (count > limit) throw new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
      return;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (isProduction()) throw new ApiError(503, 'RATE_LIMIT_UNAVAILABLE', 'Rate limiting service is unavailable.');
    }
  }

  if (isProduction()) throw new ApiError(503, 'RATE_LIMIT_UNAVAILABLE', 'Rate limiting service is not configured.');
  const current = memory.get(key);
  if (!current || current.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return;
  }
  current.count += 1;
  if (current.count > limit) throw new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
}

export function getRedisClient() {
  return client();
}

