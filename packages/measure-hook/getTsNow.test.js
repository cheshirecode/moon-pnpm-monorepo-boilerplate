import { afterEach, expect, it, vi } from 'vitest';
import getTsNow from './getTsNow';

afterEach(() => {
  vi.useRealTimers();
});

it('getTsNow()', () => {
  vi.useFakeTimers();

  const now = getTsNow();
  vi.advanceTimersByTime(1000);
  const after = getTsNow();
  expect(after - now, '2 timestamps after 1 second should differ by 1000ms').toBe(1000);
});
