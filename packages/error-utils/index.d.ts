export class AppError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly meta?: Record<string, unknown>;
  constructor(message: string, options?: { code?: string; status?: number; cause?: unknown; meta?: Record<string, unknown> });
  toJSON(): Record<string, unknown>;
}

export class NetworkError extends AppError {
  constructor(message: string, options?: { status?: number; cause?: unknown; meta?: Record<string, unknown> });
}

export class AuthError extends AppError {
  constructor(message: string, options?: { status?: number; cause?: unknown; meta?: Record<string, unknown> });
}

export class ValidationError extends AppError {
  constructor(message: string, options?: { status?: number; cause?: unknown; meta?: Record<string, unknown> });
}

export class NotFoundError extends AppError {
  constructor(message: string, options?: { status?: number; cause?: unknown; meta?: Record<string, unknown> });
}

export function isAppError(error: unknown): error is AppError;
export function getErrorMessage(error: unknown, fallback?: string): string;
export function getErrorCode(error: unknown): string;
export function createErrorBoundary<T extends (...args: unknown[]) => unknown>(fn: T, options?: { onError?: (error: unknown) => void }): (...args: Parameters<T>) => ReturnType<T>;
export function withErrorLogging<T extends (...args: unknown[]) => unknown>(fn: T, logger?: (message: string, ...args: unknown[]) => void): (...args: Parameters<T>) => ReturnType<T>;
export function tryOrDefault<T>(fn: () => T, defaultValue: T): T;