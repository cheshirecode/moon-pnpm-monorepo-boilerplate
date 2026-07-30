import { describe, it, expect } from 'vitest';
import {
  AppError, NetworkError, AuthError, ValidationError, NotFoundError,
  isAppError, getErrorMessage, getErrorCode, createErrorBoundary, withErrorLogging, tryOrDefault
} from './index.js';

describe('AppError', () => {
  it('creates an error with code and message', () => {
    const err = new AppError('Something went wrong', { code: 'TEST_ERROR' });
    expect(err.message).toBe('Something went wrong');
    expect(err.code).toBe('TEST_ERROR');
    expect(err.name).toBe('AppError');
  });

  it('defaults code to UNKNOWN', () => {
    const err = new AppError('oops');
    expect(err.code).toBe('UNKNOWN');
  });

  it('toJSON returns serializable object', () => {
    const err = new AppError('fail', { code: 'FAIL', status: 400, meta: { field: 'name' } });
    const json = err.toJSON();
    expect(json).toEqual({
      name: 'AppError',
      message: 'fail',
      code: 'FAIL',
      status: 400,
      meta: { field: 'name' },
      cause: undefined
    });
  });
});

describe('typed errors', () => {
  it('NetworkError has correct defaults', () => {
    const err = new NetworkError('network failure');
    expect(err.name).toBe('NetworkError');
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.status).toBe(0);
  });

  it('AuthError has correct defaults', () => {
    const err = new AuthError('unauthorized');
    expect(err.name).toBe('AuthError');
    expect(err.code).toBe('AUTH_ERROR');
    expect(err.status).toBe(401);
  });

  it('ValidationError has correct defaults', () => {
    const err = new ValidationError('invalid input');
    expect(err.name).toBe('ValidationError');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.status).toBe(400);
  });

  it('NotFoundError has correct defaults', () => {
    const err = new NotFoundError('not found');
    expect(err.name).toBe('NotFoundError');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.status).toBe(404);
  });
});

describe('isAppError', () => {
  it('returns true for AppError instances', () => {
    expect(isAppError(new AppError('test'))).toBe(true);
    expect(isAppError(new NetworkError('test'))).toBe(true);
  });

  it('returns false for regular errors', () => {
    expect(isAppError(new Error('test'))).toBe(false);
  });

  it('returns false for non-errors', () => {
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('extracts message from Error', () => {
    expect(getErrorMessage(new Error('fail'))).toBe('fail');
  });

  it('returns string as-is', () => {
    expect(getErrorMessage('direct')).toBe('direct');
  });

  it('returns fallback for unknown', () => {
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
    expect(getErrorMessage(42, 'fallback')).toBe('fallback');
  });
});

describe('getErrorCode', () => {
  it('returns code from AppError', () => {
    expect(getErrorCode(new AppError('test', { code: 'MY_CODE' }))).toBe('MY_CODE');
  });

  it('returns UNKNOWN for regular errors', () => {
    expect(getErrorCode(new Error('test'))).toBe('UNKNOWN');
  });
});

describe('createErrorBoundary', () => {
  it('passes through successful results', async () => {
    const fn = async (x) => x + 1;
    const wrapped = createErrorBoundary(fn);
    await expect(wrapped(1)).resolves.toBe(2);
  });

  it('calls onError on failure', async () => {
    const errors = [];
    const fn = async () => { throw new Error('fail'); };
    const wrapped = createErrorBoundary(fn, { onError: (e) => errors.push(e.message) });
    await expect(wrapped()).rejects.toThrow('fail');
    expect(errors).toEqual(['fail']);
  });
});

describe('withErrorLogging', () => {
  it('passes through results', async () => {
    const fn = async (x) => x;
    const wrapped = withErrorLogging(fn);
    await expect(wrapped(42)).resolves.toBe(42);
  });

  it('logs and re-throws', async () => {
    const logs = [];
    const fn = async () => { throw new Error('boom'); };
    const wrapped = withErrorLogging(fn, (...args) => logs.push(args.join(' ')));
    await expect(wrapped()).rejects.toThrow('boom');
    expect(logs.length).toBe(1);
  });
});

describe('tryOrDefault', () => {
  it('returns function result on success', () => {
    expect(tryOrDefault(() => 42, 0)).toBe(42);
  });

  it('returns default on exception', () => {
    expect(tryOrDefault(() => { throw new Error('fail'); }, 'fallback')).toBe('fallback');
  });
});