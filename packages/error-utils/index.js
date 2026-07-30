export class AppError extends Error {
  constructor(message, { code, status, cause, meta } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.code = code ?? 'UNKNOWN';
    this.status = status;
    this.meta = meta;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      meta: this.meta,
      cause: this.cause instanceof Error ? this.cause.message : this.cause
    };
  }
}

export class NetworkError extends AppError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code ?? 'NETWORK_ERROR', status: options.status ?? 0 });
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code ?? 'AUTH_ERROR', status: options.status ?? 401 });
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code ?? 'VALIDATION_ERROR', status: options.status ?? 400 });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code ?? 'NOT_FOUND', status: options.status ?? 404 });
    this.name = 'NotFoundError';
  }
}

export function isAppError(error) {
  return error instanceof AppError;
}

export function getErrorMessage(error, fallback = 'An unexpected error occurred') {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function getErrorCode(error) {
  if (error instanceof AppError) return error.code;
  return 'UNKNOWN';
}

export function createErrorBoundary(fn, { onError } = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (onError) onError(err);
      throw err;
    }
  };
}

export function withErrorLogging(fn, logger = console.error) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      logger('[error-utils]', err instanceof Error ? err.message : err);
      throw err;
    }
  };
}

export function tryOrDefault(fn, defaultValue) {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
}