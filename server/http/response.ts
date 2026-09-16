import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ApiError, isApiError } from '@/server/errors';

export type RequestContext = { requestId: string; startedAt: number };

export function requestContext(request: Request): RequestContext {
  const supplied = request.headers.get('x-request-id')?.trim();
  return {
    requestId: supplied && /^[a-zA-Z0-9._:-]{1,100}$/.test(supplied) ? supplied : randomUUID(),
    startedAt: Date.now(),
  };
}

export function dataResponse<T>(data: T, init: ResponseInit = {}, context?: RequestContext) {
  const headers = new Headers(init.headers);
  if (context) headers.set('x-request-id', context.requestId);
  return NextResponse.json({ data }, { ...init, headers });
}

export function listResponse<T>(data: T[], meta: { page: number; pageSize: number; total: number }, context?: RequestContext) {
  const pagination = { ...meta, totalPages: meta.pageSize ? Math.ceil(meta.total / meta.pageSize) : 0 };
  return NextResponse.json(
    { data: { items: data, ...pagination }, meta: pagination },
    { headers: context ? { 'x-request-id': context.requestId } : undefined },
  );
}

export function errorResponse(error: unknown, context: RequestContext) {
  const apiError = isApiError(error)
    ? error
    : new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong.');
  if (!isApiError(error)) {
    console.error(JSON.stringify({ requestId: context.requestId, error: error instanceof Error ? error.message : 'unknown' }));
  }
  return NextResponse.json(
    {
      error: {
        code: apiError.code,
        message: apiError.status >= 500 ? 'Something went wrong.' : apiError.message,
        ...(apiError.fieldErrors ? { fieldErrors: apiError.fieldErrors } : {}),
        requestId: context.requestId,
      },
    },
    { status: apiError.status, headers: { 'x-request-id': context.requestId } },
  );
}

export function noContent(context?: RequestContext) {
  return new NextResponse(null, { status: 204, headers: context ? { 'x-request-id': context.requestId } : undefined });
}

export function logRequest(request: Request, context: RequestContext, status: number) {
  console.info(JSON.stringify({
    requestId: context.requestId,
    route: new URL(request.url).pathname,
    method: request.method,
    status,
    duration: Date.now() - context.startedAt,
  }));
}
