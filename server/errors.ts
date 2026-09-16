export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function validationError(fieldErrors: FieldErrors, message = 'Invalid request.') {
  return new ApiError(422, 'VALIDATION_ERROR', message, fieldErrors);
}

export function unauthorized(message = 'Authentication required.') {
  return new ApiError(401, 'UNAUTHENTICATED', message);
}

export function forbidden(message = 'You do not have permission to do that.') {
  return new ApiError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'The requested resource was not found.') {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function conflict(message = 'The request conflicts with the current resource state.') {
  return new ApiError(409, 'CONFLICT', message);
}

