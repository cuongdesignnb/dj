import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ data: { status: 'ok', service: 'destiny-rave', timestamp: new Date().toISOString() } });
}

