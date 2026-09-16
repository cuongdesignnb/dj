import { NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { getRedisClient } from '@/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'failed'> = { postgres: 'failed', redis: 'failed' };
  try {
    await db.$queryRaw`SELECT 1`;
    checks.postgres = 'ok';
  } catch {
    checks.postgres = 'failed';
  }
  const redis = getRedisClient();
  if (redis) {
    try {
      if (redis.status === 'wait') await redis.connect();
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'failed';
    }
  }
  const ready = Object.values(checks).every((value) => value === 'ok');
  return NextResponse.json({ data: { status: ready ? 'ready' : 'not-ready', checks, timestamp: new Date().toISOString() } }, { status: ready ? 200 : 503 });
}

