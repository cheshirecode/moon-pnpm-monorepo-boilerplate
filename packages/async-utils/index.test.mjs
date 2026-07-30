import { describe, it, expect } from 'vitest';
import { timeout, delay, retry, debounce, throttle } from './index.js';

describe('timeout', () => {
  it('resolves after the specified delay', async () => {
    const start = Date.now();
    await timeout(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });

  it('rejects when rejectWith is provided', async () => {
    await expect(timeout(10, { rejectWith: 'oops' })).rejects.toBe('oops');
  });

  it('rejects with function result when rejectWith is a function', async () => {
    await expect(timeout(10, { rejectWith: () => new Error('timed out') })).rejects.toThrow('timed out');
  });
});

describe('delay', () => {
  it('resolves with the provided value', async () => {
    const result = await delay(10, 'hello');
    expect(result).toBe('hello');
  });
});

describe('retry', () => {
  it('resolves with the function result on success', async () => {
    const result = await retry(() => Promise.resolve(42), { tries: 3 });
    expect(result).toBe(42);
  });

  it('retries on failure and eventually succeeds', async () => {
    let attempt = 0;
    const fn = async () => {
      attempt++;
      if (attempt < 3) throw new Error('fail');
      return 'ok';
    };
    const result = await retry(fn, { tries: 3, baseDelay: 10 });
    expect(result).toBe('ok');
    expect(attempt).toBe(3);
  });

  it('throws after all retries exhausted', async () => {
    const fn = async () => { throw new Error('always fail'); };
    await expect(retry(fn, { tries: 2, baseDelay: 10 })).rejects.toThrow('always fail');
  });

  it('calls onRetry callback on each failure', async () => {
    const attempts = [];
    const fn = async (n) => { attempts.push(n); if (n < 2) throw new Error('fail'); return 'ok'; };
    const onRetry = (err, attempt) => { /* noop */ };
    const result = await retry(fn, { tries: 3, baseDelay: 10, onRetry });
    expect(result).toBe('ok');
  });
});

describe('debounce', () => {
  it('calls the function after the wait period', async () => {
    let called = 0;
    const fn = debounce(() => { called++; }, 50);
    fn();
    fn();
    fn();
    expect(called).toBe(0);
    await delay(100);
    expect(called).toBe(1);
  });

  it('cancel prevents the call', async () => {
    let called = 0;
    const fn = debounce(() => { called++; }, 50);
    fn();
    fn.cancel();
    await delay(100);
    expect(called).toBe(0);
  });
});

describe('throttle', () => {
  it('calls the function immediately on first invocation', () => {
    let called = 0;
    const fn = throttle(() => { called++; }, 100);
    fn();
    expect(called).toBe(1);
  });

  it('rate limits subsequent calls', async () => {
    let called = 0;
    const fn = throttle(() => { called++; }, 100);
    fn();
    fn();
    fn();
    expect(called).toBe(1);
    await delay(150);
    expect(called).toBe(2);
  });

  it('cancel prevents trailing call', async () => {
    let called = 0;
    const fn = throttle(() => { called++; }, 100);
    fn();
    fn();
    fn.cancel();
    await delay(150);
    expect(called).toBe(1);
  });
});