import 'server-only';
import { db } from '@/server/db/client';

function safeJson(value: unknown) {
  if (value === undefined) return undefined;
  try {
    const text = JSON.stringify(value);
    if (!text || text.length > 100_000) return undefined;
    return JSON.parse(text) as object;
  } catch {
    return undefined;
  }
}

export async function writeAuditLog(input: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  requestId: string;
}) {
  await db.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      beforeJson: safeJson(input.before),
      afterJson: safeJson(input.after),
      requestId: input.requestId,
    },
  });
}

